import { useState } from 'react'
import Canvas from './components/Canvas'
import './App.css'

function App() {
  const [guessResult, setGuessResult] = useState<string>('')
  const [isGuessing, setIsGuessing] = useState(false)

  const handleGuess = async () => {
    setIsGuessing(true)
    
    try {
      // 获取canvas元素
      const canvas = document.querySelector('canvas')
      if (!canvas) {
        throw new Error('Canvas element not found')
      }
      
      // 将canvas内容转换为图片
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Failed to create blob from canvas')
        }
        
        // 创建FormData对象
        const formData = new FormData()
        formData.append('image', blob, 'drawing.png')
        
        // 调用后端API
        const response = await fetch('http://localhost:3001/api/guess', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('API request failed')
        }
        
        const data = await response.json()
        setGuessResult(data.guess)
        setIsGuessing(false)
      })
    } catch (error) {
      console.error('Error during AI guess:', error)
      setGuessResult('AI猜测失败，请重试')
      setIsGuessing(false)
    }
  }

  return (
    <div className="app">
      <h1>AI 你画我猜游戏</h1>
      
      <div className="game-container">
        <div className="canvas-section">
          <h2>绘图区域</h2>
          <Canvas width={600} height={400} />
        </div>
        
        <div className="guess-section">
          <h2>AI 猜测结果</h2>
          <div className="guess-result">
            {isGuessing ? (
              <p>AI 正在思考...</p>
            ) : guessResult ? (
              <p>{guessResult}</p>
            ) : (
              <p>请完成绘图后点击"开始猜测"按钮</p>
            )}
          </div>
          <button 
            className="guess-button"
            onClick={handleGuess}
            disabled={isGuessing}
          >
            {isGuessing ? '猜测中...' : '开始猜测'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
