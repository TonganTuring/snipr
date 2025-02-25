import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { adminStorage } from '../firebase/admin';

// Debug logging for configuration
console.log('Starting text-to-speech service configuration...');

interface TextToSpeechOptions {
  voice?: string;
  pitch?: string;
  rate?: string;
  language?: string;
}

const DEFAULT_OPTIONS = {
  voice: "en-US-BrandonMultilingualNeural",
  pitch: "+0Hz",
  rate: "+0%",
  language: "en-US"
} as const;

export async function convertTextToSpeech(
  text: string, 
  episodeId: string,
  userId: string,
  options: TextToSpeechOptions = {}
): Promise<{ audioUrl: string; duration: number }> {
  console.log('Starting text-to-speech conversion with params:', { episodeId, userId });
  console.log('Text length:', text.length, 'characters');
  
  // Merge default options with provided options
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  console.log('Using TTS options:', finalOptions);
  
  // Create a temporary file path
  const tmpDir = os.tmpdir();
  const audioPath = path.join(tmpDir, `${episodeId}.mp3`);
  console.log('Temporary audio file path:', audioPath);

  return new Promise((resolve, reject) => {
    try {
      console.log('Configuring speech service...');
      // Configure speech service
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY!,
        process.env.AZURE_SPEECH_REGION!
      );

      // Set output format to MP3
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
      
      console.log('Speech service configured with region:', process.env.AZURE_SPEECH_REGION);
      
      // Configure voice settings
      speechConfig.speechSynthesisVoiceName = finalOptions.voice;
      speechConfig.speechSynthesisLanguage = finalOptions.language;
      console.log('Voice settings configured:', {
        voice: finalOptions.voice,
        language: finalOptions.language
      });
      
      // Set prosody options using SSML
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${finalOptions.language}">
          <voice name="${finalOptions.voice}">
            <prosody pitch="${finalOptions.pitch}" rate="${finalOptions.rate}">
              ${text}
            </prosody>
          </voice>
        </speak>`;
      console.log('SSML generated with length:', ssml.length);
      
      // Create audio config for file output
      const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioPath);
      console.log('Audio config created for output path');
      
      // Create synthesizer
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
      console.log('Speech synthesizer created');
      
      // Start synthesis
      console.log('Starting speech synthesis...');
      console.log('SSML length:', ssml.length, 'characters');
      console.log('Checking Azure credentials:', {
        hasKey: !!process.env.AZURE_SPEECH_KEY,
        hasRegion: !!process.env.AZURE_SPEECH_REGION,
        region: process.env.AZURE_SPEECH_REGION
      });
      
      // Add event handlers
      synthesizer.synthesisCompleted = () => {
        console.log('Synthesis completed event received');
      };
      
      synthesizer.synthesisStarted = () => {
        console.log('Synthesis started event received');
      };
      
      synthesizer.synthesizing = (s: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs) => {
        // Track progress but don't block
        console.log('Synthesis in progress... Audio length so far:', e.result?.audioDuration ?? 'unknown');
      };
      
      // Enhanced error handling for synthesis cancellation
      synthesizer.SynthesisCanceled = (s: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs) => {
        console.error('Synthesis canceled:', e);
        if (e.result?.errorDetails) {
          console.error('Synthesis error details:', e.result.errorDetails);
          // Don't reject here - let the main promise handle completion
        }
      };
      
      // Set a longer timeout for the synthesis operation (5 minutes)
      const synthesisTimeout = setTimeout(() => {
        console.error('Speech synthesis timeout after 5 minutes');
        synthesizer.close();
        reject(new Error('Speech synthesis timeout'));
      }, 5 * 60 * 1000);
      
      synthesizer.speakSsmlAsync(
        ssml,
        async (result) => {
          try {
            // Clear the timeout since we got a result
            clearTimeout(synthesisTimeout);
            console.log('Speech synthesis result reason:', result.reason);
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log('Speech synthesis completed successfully');
              console.log('Audio duration:', result.audioDuration / 10000000, 'seconds'); // Convert from 100-nanosecond units to seconds
              
              // Read the generated audio file
              console.log('Reading generated audio file...');
              const audioBuffer = await fs.promises.readFile(audioPath);
              console.log('Audio file read successfully, size:', audioBuffer.length, 'bytes');
              
              // Verify the audio file is not empty
              if (audioBuffer.length === 0) {
                throw new Error('Generated audio file is empty');
              }

              // Wait a short moment to ensure file is fully written
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Double check file exists and has content
              const stats = await fs.promises.stat(audioPath);
              if (stats.size === 0) {
                throw new Error('Audio file exists but is empty after waiting');
              }
              console.log('Verified audio file size:', stats.size, 'bytes');
              
              // Upload to Firebase Storage with user ID in path
              console.log('Starting Firebase Admin Storage upload...');
              
              const filePath = `podcasts/${userId}/${episodeId}.mp3`;
              console.log('Uploading to Firebase Storage path:', filePath);
              

              //console.log('**Getting Firebase Storage bucket...');
              const bucket = adminStorage.bucket(process.env.FIREBASE_ADMIN_STORAGE_BUCKET!);
              
              //console.log('Using storage bucket:', bucket);
              
              const file = bucket.file(filePath);

              //console.log('**File:', file);
              
              // Upload the file with metadata and make it public
              console.log('Starting file upload with metadata...');
              await file.save(audioBuffer, {
                contentType: 'audio/mpeg',
                metadata: {
                  userId: userId,
                  episodeId: episodeId,
                  createdAt: new Date().toISOString(),
                  fileSize: audioBuffer.length,
                },
                public: true, // Make the file publicly accessible
                resumable: true // Use resumable uploads for larger files
              });
              
              // Verify the upload was successful
              const [exists] = await file.exists();
              if (!exists) {
                throw new Error('File failed to upload to Firebase Storage');
              }
              
              // Get the permanent public URL
              console.log('Getting public URL...');
              const audioUrl = `https://storage.googleapis.com/${process.env.FIREBASE_ADMIN_STORAGE_BUCKET}/${filePath}`;
              console.log('Public URL generated:', audioUrl);
              
              // Calculate duration (approximate based on word count)
              const wordCount = text.split(/\s+/).length;
              const duration = Math.round(wordCount * 0.4); // Rough estimate: average speaking rate
              console.log('Calculated duration:', duration, 'seconds from', wordCount, 'words');
              
              resolve({ audioUrl, duration });
            } else {
              console.error('Speech synthesis failed with reason:', result.reason);
              console.error('Error details:', result.errorDetails);
              reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
            }
          } catch (error) {
            console.error('Error in speech synthesis completion handler:', error);
            reject(error);
          } finally {
            // Cleanup
            console.log('Cleaning up resources...');
            synthesizer.close();
            try {
              await fs.promises.unlink(audioPath);
              console.log('Temporary audio file cleaned up successfully');
            } catch (error) {
              console.warn('Failed to cleanup temporary audio file:', error);
            }
          }
        },
        error => {
          console.error('Speech synthesis error in callback:', error);
          synthesizer.close();
          reject(error);
        }
      );
    } catch (error) {
      console.error('Error in text-to-speech setup:', error);
      reject(error);
    }
  });
} 