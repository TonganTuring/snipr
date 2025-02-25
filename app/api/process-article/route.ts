import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { adminAuth, adminDb } from '../../firebase/admin';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

// Initialize Azure OpenAI client for summaries and chat
const openaiClient = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY! },
});

// The speech service configuration should be in your text-to-speech utility
// Make sure these environment variables are different from your OpenAI ones:
// AZURE_SPEECH_KEY
// AZURE_SPEECH_REGION
// AZURE_SPEECH_ENDPOINT

async function fetchArticleContent(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  
  // Parse the HTML using JSDOM
  const dom = new JSDOM(html);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  
  if (!article) {
    throw new Error('Failed to parse article content');
  }

  // Clean up the content
  const cleanContent = article.textContent
    // Replace multiple newlines with two newlines (paragraph breaks)
    .replace(/\n{3,}/g, '\n\n')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Add periods after common abbreviations if missing
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr)(\s)/g, '$1.$2')
    // Add pauses after punctuation
    .replace(/([.!?])\s+/g, '$1\n\n')
    // Clean up any remaining whitespace
    .trim();

  return {
    title: article.title || '',
    content: cleanContent,
    excerpt: article.excerpt || '',
    byline: article.byline || '',
    siteName: article.siteName || ''
  };
}

async function generatePodcastContent(title: string, content: string) {
  // Generate a summary using Azure OpenAI
  const summarizePrompt = `Write an engaging, conversational summary of this article in 1 paragraph, using natural language that flows well when spoken:\nTitle: ${title}\n\nContent: ${content.substring(0, 3000)}`;

  const summaryResponse = await openaiClient.chat.completions.create({
    model: 'gpt-35-turbo',
    messages: [{
      role: 'user',
      content: summarizePrompt
    }]
  });

  const summary = summaryResponse.choices[0].message?.content || '';

  // Use the article content directly instead of generating speech content
  const speechContent = content;

  return {
    summary,
    speechContent,
  };
}

interface TextToSpeechResponse {
  success: boolean;
  audioId: string;
  audioUrl: string;
  duration: number;
}

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token using Firebase Admin SDK
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const authenticatedUserId = decodedToken.uid;
      
      const { url, userId } = await request.json();

      // Verify that the authenticated user matches the requested userId
      if (authenticatedUserId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (!url || !userId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Create episode document first with 'processing' status
      const episodeId = uuidv4();
      const timestamp = new Date().toISOString();
      const episodeRef = adminDb.collection('users').doc(userId).collection('episodes').doc(episodeId);

      await episodeRef.set({
        id: episodeId,
        title: 'Processing...',
        summary: '',
        sourceUrl: url,
        status: 'processing',
        createdAt: timestamp,
        audioUrl: '',
        duration: 0,
      });

      // Start processing in the background
      processArticleInBackground(url, userId, episodeId, token).catch(error => {
        console.error('Background processing error:', error);
        // Update episode status to failed
        episodeRef.update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }).catch(console.error);
      });

      // Immediately return success response
      return NextResponse.json({
        success: true,
        episodeId,
        message: 'Article processing started',
      });

    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error processing article:', error);
    return NextResponse.json(
      { error: 'Failed to process article' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processArticleInBackground(url: string, userId: string, episodeId: string, token: string) {
  const episodeRef = adminDb.collection('users').doc(userId).collection('episodes').doc(episodeId);
  
  try {
    // 1. Fetch and parse the article
    console.log('Fetching article content...');
    const article = await fetchArticleContent(url);
    
    // Update the episode with the title
    await episodeRef.update({
      title: article.title,
    });

    // 2. Generate podcast content
    console.log('Generating podcast content...');
    const { summary, speechContent } = await generatePodcastContent(article.title, article.content);
    
    // Update the episode with the summary
    await episodeRef.update({
      summary,
    });

    // 3. Generate audio using the text-to-speech API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
      
    const ttsResponse = await fetch(`${baseUrl}/api/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: speechContent,
        userId,
      }),
    });

    if (!ttsResponse.ok) {
      throw new Error('Failed to convert text to speech');
    }

    const { audioUrl, duration } = await ttsResponse.json() as TextToSpeechResponse;

    // 4. Update the episode document with final data
    await episodeRef.update({
      audioUrl,
      duration,
      status: 'completed',
    });

    // Get the file size from the audio URL
    const audioResponse = await fetch(audioUrl, { method: 'HEAD' });
    const contentLength = parseInt(audioResponse.headers.get('content-length') || '0');

    // 5. Add episode to RSS feed
    const addEpisodeResponse = await fetch(`${baseUrl}/api/add-episode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        title: article.title,
        description: summary,
        audioUrl,
        length: contentLength, // Use actual file size
        duration: duration.toString(), // Convert duration to string format
        link: url,
      }),
    });

    if (!addEpisodeResponse.ok) {
      console.error('Failed to add episode to RSS feed:', await addEpisodeResponse.text());
    } else {
      console.log('Episode added to RSS feed successfully');
    }

    console.log('Article processing completed successfully');
  } catch (error) {
    console.error('Error in background processing:', error);
    await episodeRef.update({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error; // Re-throw to be caught by the caller
  }
} 