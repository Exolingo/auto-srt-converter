import { useState, FormEvent } from 'react'

interface Props {
  onLogin: (password: string) => void
  error: string
}

export function LoginPage({ onLogin, error }: Props) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onLogin(password)
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎬</div>
          <h1 className="text-2xl font-bold text-white">Auto SRT Converter</h1>
          <p className="text-slate-400 text-sm mt-2">뮤직비디오 자막 자동 생성기</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-800 rounded-2xl p-8 border border-surface-600"
        >
          <label className="block text-sm font-medium text-slate-300 mb-2">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            className="w-full mt-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            입장
          </button>
        </form>
      </div>
    </div>
  )
}
