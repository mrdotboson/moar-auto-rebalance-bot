import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

type Status = {
  paused: boolean;
  tick: number;
  poolStats: any;
  config: any;
};

export const App: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [pnl, setPnl] = useState<Array<{ t: number; v: number }>>([]);
  const timerRef = useRef<number | null>(null);

  async function fetchStatus() {
    const res = await fetch('/status');
    const j = await res.json();
    setStatus(j);
    const v = (j.poolStats?.tvlUSD ?? 0) + Math.random() * 0.01; // placeholder pnl visualization
    setPnl(prev => [...prev.slice(-300), { t: Date.now(), v }]);
  }

  async function rebalanceNow() {
    await fetch('/actions/rebalance', { method: 'POST' });
    await fetchStatus();
  }

  function start() {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(fetchStatus, 5000);
    fetchStatus();
  }

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => {
    fetchStatus();
    return () => stop();
  }, []);

  const data = useMemo(() => pnl.map(p => ({ time: new Date(p.t).toLocaleTimeString(), pnl: p.v })), [pnl]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16, maxWidth: 960, margin: '0 auto' }}>
      <h2>APT–USDC LP Bot</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={start}>Start</button>
        <button onClick={stop}>Stop</button>
        <button onClick={rebalanceNow}>Rebalance now</button>
      </div>

      <pre style={{ background: '#111', color: '#0f0', padding: 12, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(status, null, 2)}
      </pre>

      <h3 style={{ marginTop: 24 }}>PnL (demo)</h3>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={['auto','auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="pnl" stroke="#4ade80" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
