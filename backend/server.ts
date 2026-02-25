import express from 'express';
import cors from 'cors';
import multer from 'multer';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3001;

// 配置CORS
app.use(cors());
app.use(express.json());

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 豆包API配置
const DOBAO_API_KEY = process.env.DOBAO_API_KEY || '8be76cc6-3858-43c3-9709-1a266fe0abaa';
const DOBAO_MODEL = 'doubao-1-5-vision-pro-32k-250115';

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// AI猜测端点
app.post('/api/guess', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // 将图片转换为base64
    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    // 调用豆包API
    const guess = await callDoubaoAPI(imageUrl);

    res.json({ guess });
  } catch (error) {
    console.error('Error guessing image:', error);
    res.status(500).json({ error: 'Failed to guess image' });
  }
});

// 调用豆包API的函数
async function callDoubaoAPI(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: DOBAO_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What is in this drawing? Please guess what the user drew.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 100
    });

    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      port: 443,
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOBAO_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const guess = response.choices[0]?.message?.content || 'I cannot guess what this is.';
          resolve(guess);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
