import { NextRequest, NextResponse } from 'next/server';
import { parse, Chapter } from 'epub-parse';
import { textToSpeech, splitTextIntoChunks } from '@/app/utils/azure-tts';
import { db, storage } from '@/app/firebase/config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { AudioBook } from '@/app/types/audiobook';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const epubFile = formData.get('epub') as File;
    const userId = formData.get('userId') as string;

    if (!epubFile || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Parse EPUB
    const buffer = Buffer.from(await epubFile.arrayBuffer());
    const epubData = await parse(buffer);
    
    // Create initial audiobook record
    const audiobook: Partial<AudioBook> = {
      title: epubData.title,
      author: epubData.creator || 'Unknown',
      description: epubData.description || '',
      userId,
      originalEpubName: epubFile.name,
      status: 'processing',
      uploadedAt: new Date(),
      chapters: []
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'audiobooks'), audiobook);
    const bookId = docRef.id;

    // Process text content
    const textContent = epubData.chapters.map((chapter: Chapter) => chapter.text).join(' ');
    const chunks = splitTextIntoChunks(textContent);

    // Convert chunks to audio and upload
    const audioFiles: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const tempFilePath = `/tmp/${bookId}-${i}.mp3`;
      
      await textToSpeech(chunk, tempFilePath);
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `audiobooks/${bookId}/${i}.mp3`);
      const audioBuffer = await fs.readFile(tempFilePath);
      await uploadBytes(storageRef, audioBuffer);
      
      const audioUrl = await getDownloadURL(storageRef);
      audioFiles.push(audioUrl);
      
      // Clean up temp file
      await fs.unlink(tempFilePath);
    }

    // Combine audio URLs and update record
    const finalAudioUrl = audioFiles[0]; // Use first chunk as main audio URL
    await updateDoc(docRef, {
      audioUrl: finalAudioUrl,
      status: 'completed',
      chapters: epubData.chapters.map((chapter: Chapter, index: number) => ({
        title: chapter.title,
        startTime: index * 300, // Approximate timing, 5 minutes per chapter
        endTime: (index + 1) * 300
      }))
    });

    return NextResponse.json({ 
      message: 'Audiobook created successfully',
      bookId,
      audioUrl: finalAudioUrl
    });

  } catch (error) {
    console.error('Error processing audiobook:', error);
    return NextResponse.json(
      { error: 'Failed to process audiobook' },
      { status: 500 }
    );
  }
} 