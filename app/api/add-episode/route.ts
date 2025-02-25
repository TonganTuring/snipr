import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { adminAuth, adminDb } from '../../firebase/admin';
import { PodcastItem } from '@/app/types/podcast';
import { FieldValue } from 'firebase-admin/firestore';

interface AddEpisodeRequest {
  userId: string;
  title: string;
  description: string;
  audioUrl: string;
  length: number; // file size in bytes
  duration: string; // duration in format "HH:MM:SS"
  link?: string;
  imageUrl?: string;
  author?: string;
  explicit?: boolean;
}

export async function POST(request: Request) {
  try {
    console.log('📝 Received new episode addition request');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token using Firebase Admin SDK
    try {
      console.log('🔑 Verifying authentication token...');
      const decodedToken = await adminAuth.verifyIdToken(token);
      const authenticatedUserId = decodedToken.uid;
      console.log('✅ Token verified for user:', authenticatedUserId);
      
      const { 
        userId, 
        title, 
        description, 
        audioUrl,
        length,
        duration,
        link,
        imageUrl,
        author,
        explicit
      } = await request.json() as AddEpisodeRequest;

      console.log('📦 Received episode data:', { title, length, duration });

      // Verify that the authenticated user matches the requested userId
      if (authenticatedUserId !== userId) {
        console.log('❌ User ID mismatch. Auth:', authenticatedUserId, 'Request:', userId);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Validate required fields
      if (!userId || !title || !description || !audioUrl || !length || !duration) {
        console.log('❌ Missing required fields:', {
          hasUserId: !!userId,
          hasTitle: !!title,
          hasDescription: !!description,
          hasAudioUrl: !!audioUrl,
          hasLength: !!length,
          hasDuration: !!duration
        });
        return NextResponse.json({ 
          error: 'Missing required fields. Please provide userId, title, description, audioUrl, length, and duration.' 
        }, { status: 400 });
      }

      // Create episode document
      const episodeId = uuidv4();
      const timestamp = new Date().toISOString();
      
      console.log('💾 Creating new episode document with ID:', episodeId);
      const episodeRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('episodes')
        .doc(episodeId);

      const episodeData: PodcastItem = {
        title,
        description,
        audioUrl,
        length,
        guid: episodeId,
        pubDate: timestamp,
        duration,
        link: link || null,
        enclosure: {
          url: audioUrl,
          length: length,
          type: 'audio/mpeg',
        },
        itunes: {
          duration: duration,
          summary: description,
          explicit: explicit ? 'yes' : 'no',
          image: imageUrl || null,
          author: author || null,
        }
      };

      // Clean up undefined values
      const cleanData = JSON.parse(JSON.stringify({
        ...episodeData,
        id: episodeId,
        status: 'completed',
        createdAt: timestamp,
      }));

      // Create episode document in episodes subcollection
      await episodeRef.set(cleanData);

      // Also update the user's document to include this episode in their podcast items
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.update({
        podcastItems: FieldValue.arrayUnion(cleanData)
      });

      console.log('✅ Episode successfully created:', episodeId);
      return NextResponse.json({
        success: true,
        episodeId,
        message: 'Episode added successfully',
        episode: episodeData
      });

    } catch (error) {
      console.error('❌ Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ Error adding episode:', error);
    return NextResponse.json(
      { error: 'Failed to add episode' },
      { status: 500 }
    );
  }
} 