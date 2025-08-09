#!/usr/bin/env node

/**
 * Verified vision test for Groq API with model availability check
 * 
 * To use:
 * 1. Get a free API key from https://console.groq.com/
 * 2. Run: GROQ_API_KEY=your-key node test-vision-verified.js headshot.png
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Known vision-capable models on Groq
const VISION_MODELS = {
  'llama-4-maverick': 'llama-4-maverick-17b-128e-instruct',
  'llama-4-scout': 'llama-4-scout-17b-16e-instruct',
  'llava': 'llava-v1.5-7b-4096-preview',
  // Fallback options if llama-4 not available
  'llama-3.2-90b': 'llama-3.2-90b-vision-preview',
  'llama-3.2-11b': 'llama-3.2-11b-vision-preview'
};

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function checkAvailableModels(apiKey) {
  console.log('🔍 Checking available vision models on Groq...');
  
  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    const models = response.data || [];
    
    const visionModels = [];
    for (const [name, id] of Object.entries(VISION_MODELS)) {
      if (models.some(m => m.id === id)) {
        visionModels.push({ name, id });
      }
    }
    
    if (visionModels.length > 0) {
      console.log('✅ Found vision models:');
      visionModels.forEach(m => console.log(`   - ${m.id}`));
      return visionModels[0].id; // Return first available
    } else {
      console.log('⚠️  No known vision models found. Available models:');
      models.slice(0, 5).forEach(m => console.log(`   - ${m.id}`));
      return null;
    }
  } catch (error) {
    console.error('Failed to check models:', error.message);
    return VISION_MODELS['llama-4-maverick']; // Try default anyway
  }
}

function encodeImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

async function testVision(apiKey, modelId, imagePath, prompt) {
  console.log(`\n🤖 Testing with model: ${modelId}`);
  console.log(`📸 Image: ${imagePath} (${(fs.statSync(imagePath).size / 1024).toFixed(1)}KB)`);
  console.log(`📝 Prompt: "${prompt.substring(0, 60)}..."`);
  
  const imageDataUri = encodeImage(imagePath);
  
  // Check base64 size
  const base64Size = imageDataUri.length / 1024 / 1024;
  if (base64Size > 4) {
    throw new Error(`Encoded image too large: ${base64Size.toFixed(2)}MB (max 4MB)`);
  }
  
  const requestBody = JSON.stringify({
    model: modelId,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { 
            type: 'image_url', 
            image_url: { 
              url: imageDataUri,
              detail: 'auto'
            } 
          }
        ]
      }
    ],
    temperature: 0.3,
    max_tokens: 1000
  });
  
  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };
  
  console.log('🚀 Sending request...');
  
  const response = await makeRequest(options, requestBody);
  return response;
}

async function main() {
  const args = process.argv.slice(2);
  const imagePath = args[0] || 'headshot.png';
  const prompt = args[1] || 'Describe what you see in this image. What details can you identify about the person, objects, or scene?';
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log('❌ No GROQ_API_KEY found.\n');
    console.log('To test vision capabilities:');
    console.log('1. Sign up for free at https://console.groq.com/');
    console.log('2. Get your API key from https://console.groq.com/keys');
    console.log('3. Run: GROQ_API_KEY=your-key node test-vision-verified.js headshot.png\n');
    console.log('Groq offers free API access with:');
    console.log('- 14,400 requests/day for vision models');
    console.log('- Fast inference speeds');
    process.exit(1);
  }
  
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Image not found: ${imagePath}`);
    process.exit(1);
  }
  
  try {
    // First check what models are available
    const modelId = await checkAvailableModels(apiKey);
    
    if (!modelId) {
      console.error('❌ No vision models available');
      process.exit(1);
    }
    
    // Test vision
    const response = await testVision(apiKey, modelId, imagePath, prompt);
    
    console.log('\n✨ Response:');
    console.log('━'.repeat(60));
    console.log(response.choices[0].message.content);
    console.log('━'.repeat(60));
    
    if (response.usage) {
      const imageTokens = response.usage.prompt_tokens - Math.round(prompt.length / 4);
      console.log(`\n📊 Token Usage:`);
      console.log(`   Total: ${response.usage.total_tokens} tokens`);
      console.log(`   Image: ~${imageTokens} tokens`);
      console.log(`   Text: ~${response.usage.prompt_tokens - imageTokens} tokens`);
    }
    
    console.log('\n✅ Vision test successful!');
    console.log(`The model ${modelId} can analyze images.`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('model_not_found')) {
      console.log('\n💡 Try one of these commands to test specific models:');
      console.log('For LLaVA: GROQ_MODEL=llava-v1.5-7b-4096-preview node test-vision-verified.js headshot.png');
      console.log('For Llama 3.2: GROQ_MODEL=llama-3.2-11b-vision-preview node test-vision-verified.js headshot.png');
    } else if (error.message.includes('rate_limit')) {
      console.log('\n💡 Rate limit exceeded. Groq free tier limits:');
      console.log('- 14,400 requests/day for vision models');
      console.log('- 30 requests/minute');
    }
    
    process.exit(1);
  }
}

main();