export default function AppLoading() {
  return (
    <div className="content">
      <div className="page-header">
        <div style={{ height: '28px', width: '180px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elev)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              height: '52px',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-elev)',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
