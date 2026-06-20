require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  console.log('🔑 API Key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
  console.log('📦 SDK Version:', require('@google/generative-ai/package.json').version);
  
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.0-pro',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
  ];
  
  for (const modelName of modelsToTry) {
    console.log(`\n🧪 Trying model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello, Gemini!');
      const response = await result.response.text();
      console.log('✅ SUCCESS with model:', modelName);
      console.log('📝 Response:', response);
      return modelName;
    } catch (error) {
      console.log('❌ FAILED with model:', modelName);
      console.log('Error:', error.message);
    }
  }
  
  console.log('\n😢 No models worked!');
  return null;
}

testGemini();
