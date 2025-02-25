import { NextResponse } from 'next/server';
import { convertTextToSpeech } from '../../utils/text-to-speech';
import { v4 as uuidv4 } from 'uuid';
import { adminAuth } from '../../firebase/admin';

export async function POST(request: Request) {
  console.log('Received text-to-speech request');
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header present:', !!authHeader);
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization token format');
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    console.log('Token extracted successfully');
    
    try {
      // Verify the token using Firebase Admin SDK
      console.log('Verifying Firebase token...');
      const decodedToken = await adminAuth.verifyIdToken(token);
      const authenticatedUserId = decodedToken.uid;
      console.log('Token verified for user:', authenticatedUserId);
      
      const { text, userId } = await request.json();
      console.log('Request body parsed:', { textLength: text?.length, userId });

      if (!text || !userId) {
        console.log('Missing required fields:', { hasText: !!text, hasUserId: !!userId });
        return NextResponse.json(
          { error: 'Missing required fields: text and userId' },
          { status: 400 }
        );
      }

      // Verify that the authenticated user matches the requested userId
      if (authenticatedUserId !== userId) {
        console.log('User ID mismatch:', { authenticatedUserId, requestedUserId: userId });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Generate a unique ID for this audio conversion
      const audioId = uuidv4();
      console.log('Generated audio ID:', audioId);

      try {
        // Convert text to speech
        console.log('Starting text-to-speech conversion for audio ID:', audioId);
        const { audioUrl, duration } = await convertTextToSpeech(text, audioId, userId);
        
        console.log('Text to speech conversion complete:', { audioUrl, duration });
        return NextResponse.json({
          success: true,
          audioId,
          audioUrl,
          duration,
        });
      } catch (error) {
        console.error('Error in text-to-speech conversion:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
        return NextResponse.json(
          { error: 'Failed to convert text to speech' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      if (error instanceof Error) {
        console.error('Token verification error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    if (error instanceof Error) {
      console.error('Request processing error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 