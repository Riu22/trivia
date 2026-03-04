import { useState, useEffect } from 'react'
import { submitAnswer } from '../api'
import { Button, toast } from './Ui'

export default function QuestionCard({ question, gameId, roundId, roundEnded, myAnswer }) {
  const [selected, setSelected] = useState(myAnswer?.answer || null)
  const [text, setText] = useState(myAnswer?.answer || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!myAnswer)

  const type = question.type?.toUpperCase()
  const hasOptions = question.options?.length > 0
  const isBuzzer = type === 'BUZZER'
  const isOpenEnded = type === 'OPEN_ENDED' || type === 'SHORT_ANSWER' || (!hasOptions && !isBuzzer)

  useEffect(() => {
    if (myAnswer) {
      setSelected(myAnswer.answer)
      setText(myAnswer.answer)
      setSubmitted(true)
    }
  }, [myAnswer])

  const isCorrect = (answer) => {
    if (!roundEnded || !question.correctAnswers?.length) return null
    return question.correctAnswers
      .map(a => a.toLowerCase().trim())
      .includes(String(answer).toLowerCase().trim())
  }

  async function handleSubmit(answer) {
    if (submitted || roundEnded) return
    setSubmitting(true)
    try {
      await submitAnswer(gameId, roundId, question.id, answer)
      setSubmitted(true)
      if (hasOptions) setSelected(answer)
      else setText(answer)
      toast('¡Respuesta enviada!', 'success')
    } catch (e) {
      toast(
        e.status === 403 ? 'La ronda ha terminado o no estás en un equipo'
        : 'Error al enviar respuesta',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const getOptionStyle = (option) => {
    const base = {
      padding: '14px 18px',
      borderRadius: 'var(--radius)',
      fontSize: '14px',
      fontFamily: 'var(--font-display)',
      cursor: submitted || roundEnded ? 'default' : 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'left',
      width: '100%',
      border: '1px solid var(--border)',
      background: 'var(--bg-2)',
      color: 'var(--text)',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }

    if (roundEnded) {
      const correct = isCorrect(option)
      const isMyAnswer = selected === option
      if (correct) return { ...base, background: 'var(--green-dim)', borderColor: 'var(--green)', color: 'var(--green)', fontWeight: 700 }
      if (isMyAnswer && !correct) return { ...base, background: 'var(--red-dim)', borderColor: 'var(--red)', color: 'var(--red)' }
      return { ...base, opacity: 0.5 }
    }

    if (selected === option) {
      return { ...base, background: 'var(--accent-dim)', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 700 }
    }
    return base
  }

  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{
          fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em',
          background: 'var(--bg-2)', padding: '4px 8px', borderRadius: '4px',
        }}>
          {question.type?.replace(/_/g, ' ')}
        </span>
        {submitted && !roundEnded && (
          <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>✓ Respondido</span>
        )}
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.5, marginBottom: '20px', color: 'var(--text)' }}>
        {question.question}
      </h3>

      {question.mediaUrl && (
        <div style={{ marginBottom: '20px', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
          {question.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video controls style={{ width: '100%', maxHeight: '300px', background: '#000' }}>
              <source src={question.mediaUrl} />
            </video>
          ) : question.mediaUrl.match(/\.(mp3|wav)$/i) ? (
            <audio controls style={{ width: '100%' }}>
              <source src={question.mediaUrl} />
            </audio>
          ) : (
            <img src={question.mediaUrl} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', background: 'var(--bg-2)' }} />
          )}
        </div>
      )}

      {hasOptions && (
        <div className="options-grid">
          {question.options.map((opt, i) => (
            <button
              key={i}
              style={getOptionStyle(opt)}
              onClick={() => handleSubmit(opt)}
              disabled={submitting || submitted || roundEnded}
            >
              <span style={{ opacity: 0.5, fontSize: '12px', fontWeight: 700 }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {isOpenEnded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe tu respuesta..."
            disabled={submitted || roundEnded}
            rows={3}
            style={{
              width: '100%', padding: '12px 16px',
              borderRadius: 'var(--radius)',
              border: `1px solid ${submitted ? 'var(--green)' : 'var(--border)'}`,
              background: submitted ? 'rgba(71,255,138,0.05)' : 'var(--bg-2)',
              color: 'var(--text)', outline: 'none',
              resize: 'vertical', lineHeight: 1.5,
              fontFamily: 'var(--font-display)', fontSize: '14px',
              transition: 'border-color var(--transition)',
            }}
          />
          {!submitted && !roundEnded && (
            <Button
              onClick={() => text.trim() && handleSubmit(text.trim())}
              loading={submitting}
              disabled={!text.trim()}
              style={{ alignSelf: 'flex-end' }}
            >
              Enviar respuesta →
            </Button>
          )}
          {submitted && !roundEnded && (
            <p style={{ fontSize: '12px', color: 'var(--green)', margin: 0 }}>
              ✓ Respuesta enviada
            </p>
          )}
        </div>
      )}

      {isBuzzer && (
        <button
          onClick={() => handleSubmit('BUZZ')}
          disabled={submitting || submitted || roundEnded}
          style={{
            width: '100%', padding: '24px', borderRadius: 'var(--radius)',
            background: submitted ? 'var(--green-dim)' : 'var(--red-dim)',
            border: `2px solid ${submitted ? 'var(--green)' : 'var(--red)'}`,
            color: submitted ? 'var(--green)' : 'var(--red)',
            fontSize: '20px', fontWeight: 800,
            cursor: submitted || roundEnded ? 'default' : 'pointer',
            textTransform: 'uppercase', letterSpacing: '2px',
          }}
        >
          {submitting ? '...' : submitted ? '🔔 ¡PULSADO!' : '🔔 ¡PULSAR!'}
        </button>
      )}

      {roundEnded && question.correctAnswers?.length > 0 && (
        <div style={{
          marginTop: '20px', padding: '14px',
          background: 'rgba(71,255,138,0.1)', borderRadius: 'var(--radius)',
          border: '1px dashed var(--green)', textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 700, margin: 0 }}>
            SOLUCIÓN: {question.correctAnswers.join(' / ')}
          </p>
        </div>
      )}
    </div>
  )
}