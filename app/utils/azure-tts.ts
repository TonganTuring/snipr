import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const AZURE_SUBSCRIPTION_KEY = process.env.AZURE_SUBSCRIPTION_KEY!;
const AZURE_REGION = process.env.AZURE_REGION || 'eastus';

export const createSpeechConfig = () => {
  return sdk.SpeechConfig.fromSubscription(AZURE_SUBSCRIPTION_KEY, AZURE_REGION);
};

export const textToSpeech = async (text: string, outputFilePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const speechConfig = createSpeechConfig();
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputFilePath);
    
    // Configure voice - using a neural voice for better quality
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
    
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
      text,
      result => {
        if (result) {
          synthesizer.close();
          resolve();
        }
      },
      error => {
        synthesizer.close();
        reject(error);
      }
    );
  });
};

export const splitTextIntoChunks = (text: string, maxChunkLength: number = 5000): string[] => {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentences (roughly)
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkLength) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}; 