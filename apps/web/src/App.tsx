import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'

import { api, loadSession, saveSession, type AccessLog, type Answer, type Monitoring, type Session, type System } from './lib/api'
import { assets } from './lib/assets'
import { entryQuestions, finalQuestions, outletPrimaryQuestions, photoDefinitions, q13Options, type Question } from './lib/questions'

const draftKey = 'sanetes.monitoring-draft'
type Draft = { systemId: string; answers: Record<string, Answer>; report: string }
const emptyDraft: Draft = { systemId: '', answers: {}, report: '' }
const q13Question: Question = { key: 'q13', number: 13, displayNumber: 6, prompt: 'Com qual das faixas de cores abaixo sua amostra mais se parece?', options: [] }
const questionsByKey = new Map([...entryQuestions, ...outletPrimaryQuestions, q13Question, ...finalQuestions].map((question) => [question.key, question]))

function readDraft(): Draft {
  try { return JSON.parse(localStorage.getItem(draftKey) ?? '') as Draft } catch { return emptyDraft }
}

function App() {
  const [session, setSessionState] = useState<Session | null>(() => loadSession())
  const setSession = (value: Session | null) => { saveSession(value); setSessionState(value) }
  return <BrowserRouter><Routes>
    <Route path="/login" element={session ? <Navigate to={session.user.role === 'admin' ? '/admin/sistemas' : '/monitoramentos/novo/inicio'} replace /> : <Login onLogin={setSession} />} />
    <Route path="/sobre" element={<AboutResearch />} />
    <Route path="/admin/*" element={<Protected session={session} role="admin"><AdminLayout session={session!} onLogout={() => setSession(null)} /></Protected>} />
    <Route path="/monitoramentos/novo/:step" element={<Protected session={session} role="field"><Questionnaire session={session!} onLogout={() => setSession(null)} /></Protected>} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></BrowserRouter>
}

function Protected({ session, role, children }: { session: Session | null; role: 'admin' | 'field'; children: ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  if (session.user.role !== role) return <Navigate to={session.user.role === 'admin' ? '/admin/sistemas' : '/monitoramentos/novo/inicio'} replace />
  return children
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  useEffect(() => {
    if (!showHelp) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowHelp(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showHelp])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true)
    const data = new FormData(event.currentTarget)
    try {
      onLogin(await api<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ login: data.get('login'), password: data.get('password') }) }))
    } catch { setError('AVISO: Usuário ou senha estão incorretos.') } finally { setLoading(false) }
  }
  return <><main className="login-page">
    <section className="login-brand">
      <img src={assets.brand.wordmark} alt="Sanetes Rurais" />
      <span className="kicker">Sanetes rurais</span>
      <h1>Monitoramento de ETEs rurais.</h1>
      <p>Aplicativo de apoio ao acompanhamento de sistemas domiciliares e comunitários de tratamento de esgoto.</p>
    </section>
    <section className="login-card">
      <img className="login-card-logo" src={assets.brand.wordmark} alt="Sanetes Rurais" />
      <div><span className="kicker">Acesso seguro</span><h2>Entrar</h2><p>Use a conta vinculada ao seu sistema.</p></div>
      <form onSubmit={submit}>
        <label>Login<input name="login" autoComplete="username" required /></label>
        <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <button className="mobile-help-button" type="button" onClick={() => setShowHelp(true)}>Dúvidas sobre o aplicativo</button>
      <Link className="research-link" to="/sobre">Sobre o projeto e a pesquisa</Link>
    </section>
  </main>{showHelp && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="Fechar dúvidas" onClick={() => setShowHelp(false)}>×</button><span className="kicker">Sanetes rurais</span><h2 id="help-title">Dúvidas sobre o aplicativo</h2><p>O sanetes rurais é um aplicativo fruto de uma pesquisa de mestrado, desenvolvido para dispositivos android para auxiliar o processo de monitoramento em campo de ETEs domiciliares e comunitárias.</p><div className="help-notice"><strong>Antes de iniciar</strong><p>Certifique-se de que seu aparelho continue conectado à rede de internet durante o envio do monitoramento.</p></div><h3>Contatos</h3><p>Andreza Carla Lopes André<br /><a href="mailto:andreza_carlalopes@hotmail.com">andreza_carlalopes@hotmail.com</a></p><p>Antonio dos Santos Filho<br /><a href="mailto:antonio.santosfilho@discente.univasf.edu.br">antonio.santosfilho@discente.univasf.edu.br</a></p><p>Miriam Cleide Cavalcante de Amorim<br /><a href="mailto:miriamcleidea@gmail.com">miriamcleidea@gmail.com</a></p><button className="button primary" type="button" onClick={() => setShowHelp(false)}>Entendi</button></section></div>}</>
}

function AboutResearch() {
  return <div className="about-page">
    <header className="about-header">
      <Link to="/login"><img src={assets.brand.wordmark} alt="Sanetes rurais" /></Link>
      <Link to="/login">Voltar para o login</Link>
    </header>

    <main className="about-content">
      <header className="about-title">
        <p className="about-category">Sobre o projeto</p>
        <h1>Sanetes Rurais</h1>
        <p>Aplicativo de apoio ao monitoramento de estações de tratamento de esgotos domiciliares e comunitárias em áreas rurais.</p>
      </header>

      <section className="about-summary" aria-labelledby="origem-title">
        <div>
          <h2 id="origem-title">Origem</h2>
          <p>O aplicativo é um dos produtos da dissertação <cite>Desenvolvimento de tecnologia social para monitoramento de estações de tratamento de esgotos domiciliares e comunitários</cite>, desenvolvida por Andreza Carla Lopes André no Mestrado Profissional em Propriedade Intelectual e Transferência de Tecnologia para a Inovação da Universidade Federal do Vale do São Francisco.</p>
          <p>A pesquisa partiu da dificuldade de realizar o monitoramento frequente de ETEs rurais por meio de análises laboratoriais, considerando custos e logística de coleta e transporte das amostras.</p>
        </div>
        <dl className="about-metadata">
          <div><dt>Autora</dt><dd>Andreza Carla Lopes André</dd></div>
          <div><dt>Orientadora</dt><dd>Miriam Cleide Cavalcante de Amorim</dd></div>
          <div><dt>Instituição</dt><dd>UNIVASF</dd></div>
          <div><dt>Programa</dt><dd>PROFNIT</dd></div>
          <div><dt>Local e ano</dt><dd>Juazeiro–BA, 2023</dd></div>
        </dl>
      </section>

      <section className="about-section" aria-labelledby="objetivo-title">
        <h2 id="objetivo-title">Objetivo da pesquisa</h2>
        <p>Desenvolver uma tecnologia social para apoiar o monitoramento da qualidade operacional de ETEs rurais e estimar a qualidade final do esgoto tratado por meio de observações realizadas em campo.</p>
      </section>

      <section className="about-section" aria-labelledby="dados-title">
        <h2 id="dados-title">Dados do estudo</h2>
        <div className="about-table-wrap"><table className="about-table"><tbody>
          <tr><th scope="row">Sistemas monitorados</th><td>14 ETEs instaladas no semiárido nordestino</td></tr>
          <tr><th scope="row">Período</th><td>15 meses, entre julho de 2021 e setembro de 2022</td></tr>
          <tr><th scope="row">Coletas</th><td>15 coletas de esgoto bruto e tratado</td></tr>
          <tr><th scope="row">Análises</th><td>Parâmetros físico-químicos e microbiológicos, acompanhados de registros fotográficos</td></tr>
          <tr><th scope="row">Tratamento dos dados</th><td>Clusterização com o algoritmo K-means</td></tr>
          <tr><th scope="row">Resultado do agrupamento</th><td>Três grupos, com coeficiente médio de silhueta de 0,72</td></tr>
        </tbody></table></div>
      </section>

      <section className="about-section" aria-labelledby="metodo-title">
        <h2 id="metodo-title">Método</h2>
        <ol className="about-list">
          <li>Coleta de amostras na entrada e na saída das ETEs.</li>
          <li>Análise das amostras no Laboratório de Engenharia Ambiental da UNIVASF.</li>
          <li>Registro fotográfico das amostras tratadas para formação de um banco de cores.</li>
          <li>Agrupamento dos dados laboratoriais e das cores em três conjuntos.</li>
          <li>Uso das escalas de cores em uma rotina de perguntas sobre condições visuais, olfativas e operacionais do sistema.</li>
        </ol>
      </section>

      <section className="about-section" aria-labelledby="escalas-title">
        <h2 id="escalas-title">Escalas de cores utilizadas no aplicativo</h2>
        <p>As escalas abaixo foram formadas a partir das amostras agrupadas durante a pesquisa. No aplicativo, o usuário seleciona primeiro a escala mais semelhante à amostra e depois a faixa de cor correspondente.</p>
        <div className="about-scales">
          {assets.questionnaire.clusters.map((image, index) => <figure key={image}><img src={image} alt={`Escala de cores ${index + 1}`} /><figcaption>Escala {index + 1}</figcaption></figure>)}
        </div>
      </section>

      <section className="about-section about-warning" aria-labelledby="limites-title">
        <h2 id="limites-title">Limites de uso</h2>
        <p>O resultado apresentado pelo Sanetes Rurais é uma estimativa. O aplicativo não substitui o monitoramento laboratorial convencional.</p>
        <p>A dissertação recomenda a ampliação do banco de dados, a validação da tecnologia em campo e sua atualização contínua. Situações fora das escalas disponíveis ou indícios de problemas operacionais devem ser encaminhados para avaliação técnica.</p>
      </section>

      <section className="about-section" aria-labelledby="produtos-title">
        <h2 id="produtos-title">Produtos associados à pesquisa</h2>
        <ul className="about-list">
          <li>Tecnologia social para monitoramento de ETEs rurais.</li>
          <li>Aplicativo Sanetes Rurais.</li>
          <li>Manual de Boas Práticas Operacionais de ETEs.</li>
          <li>Mapeamento tecnológico, artigo científico, matriz SWOT e modelo de negócio.</li>
        </ul>
      </section>

      <section className="about-document">
        <div><h2>Dissertação completa</h2><p>O documento contém a fundamentação, a metodologia, os resultados, as limitações e os anexos do trabalho.</p></div>
        <a className="button primary" href="/docs/dissertacao-sanetes.pdf" target="_blank" rel="noreferrer">Abrir PDF</a>
      </section>
    </main>

    <footer className="about-footer"><p>Pesquisa desenvolvida no PROFNIT/UNIVASF, em parceria com o IRPAA e o Laboratório de Engenharia Ambiental.</p></footer>
  </div>
}

function AdminLayout({ session, onLogout }: { session: Session; onLogout: () => void }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="sidebar-brand" to="/admin/sistemas"><img src={assets.brand.wordmark} alt="Sanetes rurais" /></Link>
      <nav><NavLink to="/admin/sistemas">Cadastro</NavLink><NavLink to="/admin/monitoramentos">Dados coletados</NavLink><NavLink to="/admin/acessos">Logs de acesso</NavLink></nav>
      <div className="sidebar-user"><span>{session.user.name}</span><button onClick={onLogout}>Sair</button></div>
    </aside>
    <div className="app-content"><Routes>
      <Route path="sistemas" element={<SystemsPage session={session} />} />
      <Route path="monitoramentos" element={<MonitoringsPage session={session} />} />
      <Route path="monitoramentos/:id" element={<MonitoringDetail session={session} />} />
      <Route path="acessos" element={<AccessLogsPage session={session} />} />
      <Route path="*" element={<Navigate to="sistemas" replace />} />
    </Routes></div>
  </div>
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-header"><div><span className="kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>
}

function SystemsPage({ session }: { session: Session }) {
  const [systems, setSystems] = useState<System[]>([])
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const load = () => api<System[]>('/systems', {}, session.token).then(setSystems).catch((error) => setMessage(error.message))
  useEffect(() => { void load() }, [session.token])
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try { await api('/systems', { method: 'POST', body: JSON.stringify(values) }, session.token); event.currentTarget.reset(); setShowForm(false); setMessage('Sistema cadastrado com sucesso.'); load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao cadastrar.') }
  }
  async function visit(id: string) { await api(`/systems/${id}/visit`, { method: 'POST' }, session.token); load() }
  async function remove(system: System) {
    if (!window.confirm(`Apagar o cadastro de “${system.name}”? Todos os monitoramentos e fotos desse sistema também serão apagados permanentemente.`)) return
    try { await api(`/systems/${system.id}`, { method: 'DELETE' }, session.token); setMessage('Cadastro apagado com sucesso.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível apagar o cadastro.') }
  }
  return <main className="page">
    <PageHeader eyebrow="Banco de usuários" title="Cadastro de sistema" description="Responsáveis, credenciais e histórico de visitas." action={<button className="button primary" onClick={() => setShowForm((value) => !value)}>Cadastrar</button>} />
    {message && <div className="notice">{message}</div>}
    {showForm && <form className="panel form-grid" onSubmit={create}>
      <h2>Cadastro de sistema</h2>
      <label>Responsável<input name="responsibleName" required /></label><label>Nome do sistema<input name="name" required /></label>
      <label>Cidade / UF<input name="city" required /></label><label>Coordenadas<input name="coordinates" placeholder="-9.123, -40.456" /></label>
      <label>Número de indivíduos<input name="residentsCount" type="number" min="1" /></label><span />
      <label>Login do responsável<input name="login" required /></label><label>Senha inicial<input name="password" type="password" minLength={6} required /></label>
      <div className="form-actions"><button className="button ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="button primary">Cadastrar</button></div>
    </form>}
    <section className="card-grid">{systems.map((system) => <article className="system-card" key={system.id}>
      <div className="card-top"><span className="status-badge">Ativo</span><span>{system.residentsCount ? `${system.residentsCount} pessoas` : 'População não informada'}</span></div>
      <h2>{system.name}</h2><p>{system.responsibleName}</p><p className="muted">{system.city}</p>
      <div className="card-footer"><span>Última visita<br /><strong>{system.lastVisitAt ? formatDate(system.lastVisitAt) : 'Ainda não registrada'}</strong></span><div className="card-actions"><button className="text-button" onClick={() => visit(system.id)}>Registrar visita</button><button className="text-button danger" onClick={() => remove(system)}>Apagar cadastro</button></div></div>
    </article>)}</section>
    {!systems.length && <Empty text="Nenhum sistema cadastrado." />}
  </main>
}

function MonitoringsPage({ session }: { session: Session }) {
  const [items, setItems] = useState<Monitoring[]>([])
  const [message, setMessage] = useState('')
  const load = () => api<Monitoring[]>('/monitorings', {}, session.token).then(setItems).catch((error) => setMessage(error.message))
  useEffect(() => { void load() }, [session.token])
  async function remove(item: Monitoring) {
    if (!window.confirm(`Apagar permanentemente o monitoramento de “${item.system?.name ?? 'Sistema'}” coletado em ${formatDate(item.createdAt, true)}?`)) return
    try { await api(`/monitorings/${item.id}`, { method: 'DELETE' }, session.token); setMessage('Registro apagado com sucesso.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível apagar o registro.') }
  }
  return <main className="page"><PageHeader eyebrow="Dados coletados" title="Banco de dados" description="Consulte as coletas enviadas, respostas e evidências fotográficas." />
    {message && <div className="notice">{message}</div>}
    <div className="table-panel"><div className="table-head"><span>Sistema</span><span>Coleta</span><span>Situação</span><span /></div>{items.map((item) => <div className="table-row" key={item.id}><strong>{item.system?.name ?? 'Sistema'}</strong><span>{formatDate(item.createdAt, true)}</span><span className="status-badge">Sincronizado</span><div className="row-actions"><Link to={`/admin/monitoramentos/${item.id}`}>Ver detalhes →</Link><button className="text-button danger" onClick={() => remove(item)}>Apagar</button></div></div>)}</div>
    {!items.length && <Empty text="Nenhum monitoramento enviado." />}</main>
}

function AccessLogsPage({ session }: { session: Session }) {
  const [items, setItems] = useState<AccessLog[]>([])
  const [message, setMessage] = useState('')
  useEffect(() => {
    api<AccessLog[]>('/access-logs', {}, session.token).then(setItems).catch((error) => setMessage(error.message))
  }, [session.token])
  const successful = items.filter((item) => item.success).length
  const denied = items.length - successful
  return <main className="page">
    <PageHeader eyebrow="Segurança" title="Logs de acesso" description="Últimas 500 tentativas de entrada registradas no aplicativo." />
    {message && <div className="notice">{message}</div>}
    <section className="access-summary" aria-label="Resumo dos acessos"><article><span>Total registrado</span><strong>{items.length}</strong></article><article><span>Acessos autorizados</span><strong>{successful}</strong></article><article><span>Tentativas recusadas</span><strong>{denied}</strong></article></section>
    <div className="access-table">
      <div className="access-table-head"><span>Data e hora</span><span>Login</span><span>Perfil</span><span>Resultado</span><span>Endereço IP</span><span>Dispositivo</span></div>
      {items.map((item) => <article className="access-table-row" key={item.id}>
        <span data-label="Data e hora">{formatDate(item.createdAt, true)}</span>
        <strong data-label="Login">{item.login}</strong>
        <span data-label="Perfil">{item.role === 'admin' ? 'Administrador' : item.role === 'field' ? 'Responsável' : 'Não identificado'}</span>
        <span data-label="Resultado" className={`access-status ${item.success ? 'success' : 'denied'}`}>{item.success ? 'Autorizado' : 'Recusado'}</span>
        <span data-label="Endereço IP" className="access-ip">{item.ipAddress}</span>
        <span data-label="Dispositivo" className="access-device" title={item.userAgent ?? 'Não informado'}>{deviceLabel(item.userAgent)}</span>
      </article>)}
    </div>
    {!items.length && !message && <Empty text="Nenhum acesso registrado até o momento." />}
  </main>
}

function MonitoringDetail({ session }: { session: Session }) {
  const navigate = useNavigate(); const { id } = useParams(); const [item, setItem] = useState<Monitoring | null>(null)
  useEffect(() => { if (id) api<Monitoring>(`/monitorings/${id}`, {}, session.token).then(setItem) }, [id, session.token])
  if (!item) return <main className="page"><Empty text="Carregando monitoramento…" /></main>
  const monitoringId = item.id
  const outletAnswerKeys = [...outletPrimaryQuestions.map((question) => question.key), 'q13', ...finalQuestions.map((question) => question.key)]
  async function remove() { if (window.confirm('Apagar permanentemente este monitoramento e suas fotografias?')) { await api(`/monitorings/${monitoringId}`, { method: 'DELETE' }, session.token); navigate('/admin/monitoramentos') } }
  return <main className="page"><Link className="back-link" to="/admin/monitoramentos">← Voltar</Link><PageHeader eyebrow="Detalhe da coleta" title={item.system?.name ?? 'Monitoramento'} description={`Coleta registrada em ${formatDate(item.createdAt, true)}`} action={<button className="button danger" onClick={remove}>Apagar registro</button>} />
    <section className="detail-layout"><div className="panel answers"><div className="answers-heading"><span className="kicker">Questionário preenchido</span><h2>Respostas do monitoramento</h2></div><AnswerSection title="Entrada do sistema" keys={entryQuestions.map((question) => question.key)} answers={item.answers} /><AnswerSection title="Saída do sistema" keys={outletAnswerKeys} answers={item.answers} /></div>
      <div><section className="panel"><h2>Feedback</h2><p>{item.feedback.quality}</p>{item.feedback.recommendations.map((text) => <p className="recommendation" key={text}>{text}</p>)}</section><section className="photo-grid admin-photos">{item.photos?.map((photo) => <figure key={photo.id}><img src={photo.url} alt={photo.originalName} /><figcaption>{photoLabel(photo.category)}</figcaption></figure>)}</section></div></section>
  </main>
}

function AnswerSection({ title, keys, answers }: { title: string; keys: string[]; answers: Record<string, Answer> }) {
  return <section className="answers-section"><h3>{title}</h3>{keys.map((key) => {
    const answer = answers[key]
    const question = questionDetails(key)
    if (!answer || !question) return null
    return <article className="answer-item" key={key}><span className="answer-number">{question.displayNumber ?? question.number}</span><div className="answer-content"><p>{question.prompt}</p><strong>{answerLabel(key, answer, answers)}</strong>{answer.detail && <small>{answerDetailLabel(key, answer)}</small>}{answer.date && <small>{answerDateLabel(key)} {formatAnswerDate(answer.date)}</small>}</div></article>
  })}</section>
}

function Questionnaire({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const navigate = useNavigate(); const { step = 'inicio' } = useParams()
  const [draft, setDraft] = useState<Draft>(() => { const saved = readDraft(); return { ...saved, systemId: saved.systemId || session.systems[0]?.id || '' } })
  const [photos, setPhotos] = useState<Record<string, File>>({})
  const [error, setError] = useState(''); const [sending, setSending] = useState(false); const [result, setResult] = useState<Monitoring | null>(null)
  useEffect(() => { localStorage.setItem(draftKey, JSON.stringify(draft)) }, [draft])
  const setAnswer = (key: string, patch: Partial<Answer>) => setDraft((current) => {
    const answers = { ...current.answers, [key]: { ...current.answers[key], value: current.answers[key]?.value ?? '', ...patch } }
    if (key === 'q12' && patch.value !== current.answers.q12?.value) {
      delete answers.q13
      if (patch.value === 'NENHUM CLUSTER') answers.q13 = { value: 'NENHUM CLUSTER' }
    }
    return { ...current, answers }
  })
  const go = (next: string) => { setError(''); navigate(`/monitoramentos/novo/${next}`); window.scrollTo(0, 0) }
  function validateQuestions(questions: Question[]) {
    for (const question of questions) { const answer = draft.answers[question.key]; if (!answer?.value) return `Responda a questão ${question.number}.`; if (question.dateWhen === answer.value && !answer.date) return `Informe a data da questão ${question.number}.`; if (question.detailLabel && !answer.detail?.trim()) return `Complete a questão ${question.number}.` }
    return ''
  }
  function advance(next: string, questions: Question[]) { const problem = validateQuestions(questions); if (problem) setError(problem); else go(next) }
  async function submitMonitoring() {
    if (photoDefinitions.some((photo) => !photos[photo.key])) return setError('Adicione as quatro fotografias solicitadas.')
    setSending(true); setError('')
    const form = new FormData(); form.set('systemId', draft.systemId); form.set('answers', JSON.stringify(draft.answers)); form.set('report', draft.report)
    photoDefinitions.forEach((photo) => form.set(photo.key, photos[photo.key]!))
    try { const created = await api<Monitoring>('/monitorings', { method: 'POST', body: form }, session.token); setResult(created); localStorage.removeItem(draftKey); go('resultado') } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível sincronizar.') } finally { setSending(false) }
  }

  if (step === 'resultado') {
    const table = result ? clusterAsset(result.answers.q12?.value) : ''
    return <FieldShell session={session} onLogout={onLogout} progress={100}><main className="result-screen"><section className="result-card">
      <div className="result-copy"><div className="success-mark">✓</div><span className="kicker">Feedback de qualidade do esgoto tratado</span><h1>Obrigado. Seu monitoramento foi registrado!</h1><p className="quality-result">{result?.feedback.quality ?? 'Seu monitoramento foi enviado com sucesso.'}</p><div className="result-recommendations">{result?.feedback.recommendations.map((text) => <p className="recommendation" key={text}>{text}</p>)}</div><button className="button primary" onClick={() => { setDraft({ ...emptyDraft, systemId: session.systems[0]?.id ?? '' }); setPhotos({}); setResult(null); go('inicio') }}>Fechar</button></div>
      {table ? <figure className="result-table"><figcaption>O seu sistema provavelmente apresenta os parâmetros dentro das faixas abaixo.</figcaption><img src={table} alt="Tabela com as faixas prováveis dos parâmetros do esgoto tratado" /></figure> : <div className="result-no-table"><strong>Nenhuma faixa de cor foi selecionada.</strong><p>O IRPAA deverá avaliar o sistema durante uma visita técnica.</p></div>}
    </section></main></FieldShell>
  }
  const steps: Record<string, { title: string; subtitle: string; progress: number }> = {
    inicio: { title: 'Novo monitoramento', subtitle: '', progress: 7 },
    entrada: { title: 'Entrada', subtitle: 'Com uma garrafa PET transparente (500ML), colete agora uma amostra da ENTRADA do seu sistema de tratamento (após a caixa de gordura) e responda as perguntas abaixo:', progress: 18 },
    'entrada-salva': { title: 'Entrada', subtitle: '', progress: 35 },
    saida: { title: 'Saída', subtitle: 'Colete agora uma amostra da SAÍDA do seu sistema de tratamento (no tanque de armazenamento) e responda as perguntas abaixo:', progress: 42 },
    manejo: { title: 'Saída', subtitle: 'Continue respondendo as perguntas sobre a saída do seu sistema de tratamento.', progress: 66 },
    'saida-salva': { title: 'Saída', subtitle: '', progress: 74 },
    fotos: { title: 'Fotos', subtitle: 'Para finalizar o monitoramento do seu sistema, envie as fotos abaixo:', progress: 82 },
    revisao: { title: 'Fotos', subtitle: 'Confira as informações antes de enviar o monitoramento.', progress: 94 },
  }
  const meta = steps[step] ?? steps.entrada!
  return <FieldShell session={session} onLogout={onLogout} progress={meta.progress}><main className="wizard-page"><PageHeader eyebrow="Novo monitoramento" title={meta.title} description={meta.subtitle} />
    {step === 'inicio' && <section className="question-card confirmation-card intro-card"><p>A seguir você irá responder algumas perguntas sobre a entrada e saída de seu sistema de tratamento.</p><p>Certifique-se de que seu aparelho continue conectado à rede de internet.</p><WizardActions error={error} next={() => go('entrada')} nextLabel="Continuar" /></section>}
    {step === 'entrada' && <><SystemSelector systems={session.systems} value={draft.systemId} onChange={(systemId) => setDraft({ ...draft, systemId })} /><QuestionList questions={entryQuestions} answers={draft.answers} onChange={setAnswer} /><WizardActions error={error} next={() => advance('entrada-salva', entryQuestions)} /></>}
    {step === 'entrada-salva' && <section className="question-card confirmation-card"><div className="success-mark">✓</div><p>Obrigado. A situação da ENTRADA do seu sistema foi salva com sucesso, para continuar com o monitoramento clique em "Preencher saída"</p><WizardActions error={error} back={() => go('entrada')} next={() => go('saida')} nextLabel="Preencher saída" /></section>}
    {step === 'saida' && <><QuestionList questions={outletPrimaryQuestions.filter((question) => question.key !== 'q12')} answers={draft.answers} onChange={setAnswer} /><ColorGroupQuestion answer={draft.answers.q12} onChange={(answer) => setAnswer('q12', answer)} />{draft.answers.q12?.value && draft.answers.q12.value !== 'NENHUM CLUSTER' && <Q13 answer={draft.answers.q13} cluster={draft.answers.q12.value} onChange={(answer) => setAnswer('q13', answer)} />}<WizardActions error={error} back={() => go('entrada')} next={() => advance('manejo', [...outletPrimaryQuestions, { key: 'q13', number: 13, displayNumber: 6, prompt: '', options: q13Options(draft.answers.q12?.value) }])} /></>}
    {step === 'manejo' && <><QuestionList questions={finalQuestions} answers={draft.answers} onChange={setAnswer} /><WizardActions error={error} back={() => go('saida')} next={() => advance('saida-salva', finalQuestions)} /></>}
    {step === 'saida-salva' && <section className="question-card confirmation-card"><div className="success-mark">✓</div><h2>Obrigado. A situação da SAÍDA do seu sistema foi salva com sucesso!</h2><label>Gostaria de relatar alguma dúvida ou dificuldade com o manejo do seu sistema?<textarea value={draft.report} onChange={(event) => setDraft({ ...draft, report: event.target.value })} /></label><WizardActions error={error} back={() => go('manejo')} next={() => go('fotos')} /></section>}
    {step === 'fotos' && <><section className="photo-grid">{photoDefinitions.map((photo) => <label className="photo-input" key={photo.key}>{photos[photo.key] ? <img src={URL.createObjectURL(photos[photo.key]!)} alt="Prévia" /> : <span className="photo-placeholder">+</span>}<strong>{photo.label}</strong><small>{photo.help}</small><input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPhotos((current) => ({ ...current, [photo.key]: file })) }} /></label>)}</section><WizardActions error={error} back={() => go('manejo')} next={() => { if (photoDefinitions.some((photo) => !photos[photo.key])) setError('Adicione as quatro fotografias.'); else go('revisao') }} /></>}
    {step === 'revisao' && <><section className="review-grid"><div className="panel"><span className="kicker">Sistema</span><h2>{session.systems.find((system) => system.id === draft.systemId)?.name}</h2><p>17 de 17 respostas preenchidas</p><p>{Object.keys(photos).length} de 4 fotos selecionadas</p>{draft.report && <p>Relato de manejo incluído</p>}</div><div className="panel sync-panel"><div className="sync-icon">↥</div><h2>Pronto para sincronizar</h2><p>O envio só será concluído depois da confirmação do servidor.</p></div></section><WizardActions error={error} back={() => go('fotos')} next={submitMonitoring} nextLabel={sending ? 'Enviando…' : 'Enviar monitoramento'} disabled={sending} /></>}
  </main></FieldShell>
}

function FieldShell({ session, onLogout, progress, children }: { session: Session; onLogout: () => void; progress: number; children: ReactNode }) {
  return <div className="field-shell"><header><img src={assets.brand.wordmark} alt="Sanetes Rurais" /><div><span>{session.user.name}</span><button onClick={onLogout}>Sair</button></div></header><div className="progress"><span style={{ width: `${progress}%` }} /></div>{children}</div>
}

function SystemSelector({ systems, value, onChange }: { systems: System[]; value: string; onChange: (value: string) => void }) {
  if (systems.length <= 1) return <div className="selected-system"><span>Sistema monitorado</span><strong>{systems[0]?.name ?? 'Nenhum sistema associado'}</strong></div>
  return <label className="selected-system">Sistema monitorado<select value={value} onChange={(event) => onChange(event.target.value)}>{systems.map((system) => <option value={system.id} key={system.id}>{system.name}</option>)}</select></label>
}

function QuestionList({ questions, answers, onChange }: { questions: Question[]; answers: Record<string, Answer>; onChange: (key: string, patch: Partial<Answer>) => void }) {
  return <section className="questions">{questions.map((question) => <article className="question-card" key={question.key}><span className="question-number">Questão {question.displayNumber ?? question.number}</span><h2>{question.prompt}</h2><div className="option-grid">{question.options.map((option) => <label className={answers[question.key]?.value === option.value ? 'option selected' : 'option'} key={option.value}><input type="radio" name={question.key} checked={answers[question.key]?.value === option.value} onChange={() => onChange(question.key, { value: option.value, date: undefined, detail: answers[question.key]?.detail })} /><span>{option.label}</span></label>)}</div>{question.dateWhen !== undefined && question.dateWhen === answers[question.key]?.value && <label className="conditional-field">{question.dateLabel ?? 'Escolha aqui a data da última limpeza'}<input type="date" value={answers[question.key]?.date ?? ''} onChange={(event) => onChange(question.key, { date: event.target.value })} /></label>}{question.detailLabel && answers[question.key]?.value && <label className="conditional-field">{question.detailLabel(answers[question.key])}<input value={answers[question.key]?.detail ?? ''} onChange={(event) => onChange(question.key, { detail: event.target.value })} /></label>}</article>)}</section>
}

function ColorGroupQuestion({ answer, onChange }: { answer?: Answer; onChange: (answer: Partial<Answer>) => void }) {
  const groups = [
    { value: 'CLUSTER 2', label: 'Faixas verdes', src: assets.questionnaire.samples.green },
    { value: 'CLUSTER 1', label: 'Faixas marrons', src: assets.questionnaire.samples.brown },
    { value: 'CLUSTER 0', label: 'Faixas marrons escuras', src: assets.questionnaire.samples.darkBrown },
  ]
  return <article className="question-card color-question"><span className="question-number">Questão 5</span><h2>Com qual das faixas de cores abaixo sua amostra mais se parece?</h2><div className="color-group-options">{groups.map((group) => <label className={answer?.value === group.value ? 'color-group selected' : 'color-group'} key={group.value}><input type="radio" name="q12" checked={answer?.value === group.value} onChange={() => onChange({ value: group.value })} /><img src={group.src} alt={group.label} /><span>{group.label}</span></label>)}</div><label className={answer?.value === 'NENHUM CLUSTER' ? 'none-color selected' : 'none-color'}><input type="radio" name="q12" checked={answer?.value === 'NENHUM CLUSTER'} onChange={() => onChange({ value: 'NENHUM CLUSTER' })} /><span>Minha amostra não se parece com nenhuma das faixas de cores mostradas acima</span></label></article>
}

function Q13({ answer, cluster, onChange }: { answer?: Answer; cluster?: string; onChange: (answer: Partial<Answer>) => void }) {
  const options = q13Options(cluster)
  const image = cluster === 'CLUSTER 2' ? assets.questionnaire.samples.green : cluster === 'CLUSTER 1' ? assets.questionnaire.samples.brown : assets.questionnaire.samples.darkBrown
  return <article className="question-card band-question"><span className="question-number">Questão 6</span><h2>Com qual das faixas de cores abaixo sua amostra mais se parece?</h2><p>Toque diretamente na faixa que mais se aproxima da sua amostra.</p><div className={`band-picker bands-${options.length}`}><img src={image} alt="Faixas de cores disponíveis para seleção" /><div className="band-hit-areas">{options.map((option, index) => <label className={answer?.value === option.value ? 'band-hit selected' : 'band-hit'} key={option.value}><input type="radio" name="q13" checked={answer?.value === option.value} onChange={() => onChange({ value: option.value })} /><span>{index + 1}</span></label>)}</div></div></article>
}

function WizardActions({ error, back, next, nextLabel = 'Avançar', disabled }: { error: string; back?: () => void; next: () => void; nextLabel?: string; disabled?: boolean }) {
  return <div className="wizard-actions">{error && <p className="form-error" role="alert">{error}</p>}<div>{back && <button className="button ghost" onClick={back}>Voltar</button>}<button className="button primary" onClick={next} disabled={disabled}>{nextLabel}</button></div></div>
}

function Empty({ text }: { text: string }) { return <div className="empty"><img src={assets.navigation.folder} alt="" /><p>{text}</p></div> }
function deviceLabel(userAgent?: string | null) {
  if (!userAgent) return 'Não informado'
  const platform = /Android/i.test(userAgent) ? 'Android' : /iPhone|iPad/i.test(userAgent) ? 'iOS' : /Windows/i.test(userAgent) ? 'Windows' : /Macintosh/i.test(userAgent) ? 'macOS' : /Linux/i.test(userAgent) ? 'Linux' : 'Outro sistema'
  const browser = /Edg\//i.test(userAgent) ? 'Edge' : /OPR\//i.test(userAgent) ? 'Opera' : /Chrome\//i.test(userAgent) ? 'Chrome' : /Firefox\//i.test(userAgent) ? 'Firefox' : /Safari\//i.test(userAgent) ? 'Safari' : 'Aplicativo'
  return `${platform} · ${browser}`
}

function formatDate(value: string, time = false) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', ...(time ? { timeStyle: 'short' as const } : {}) }).format(new Date(value)) }
function questionDetails(key: string) { return questionsByKey.get(key) }
function answerLabel(key: string, answer: Answer, answers: Record<string, Answer>) {
  if (answer.value === 'sim') return 'Sim'
  if (answer.value === 'não') return 'Não'
  if (key === 'q13') return q13Options(answers.q12?.value).find((option) => option.value === answer.value)?.label ?? answer.value
  return questionDetails(key)?.options.find((option) => option.value === answer.value)?.label ?? answer.value
}
function formatAnswerDate(value: string) {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}
function answerDateLabel(key: string) {
  if (key === 'q6') return 'Último descarte realizado em:'
  if (key === 'q7') return 'Realizado em:'
  return 'Última limpeza realizada em:'
}
function answerDetailLabel(key: string, answer: Answer) {
  if (key === 'q14') return `${answer.value === 'Reúso agrícola' ? 'Tipo de cultura' : 'Outro uso'}: ${answer.detail}`
  return answer.detail
}
function photoLabel(category: string) { return photoDefinitions.find((photo) => photo.key === category)?.label ?? category }
function clusterAsset(value?: string) { if (value === 'CLUSTER 0') return assets.questionnaire.clusters[0]; if (value === 'CLUSTER 1') return assets.questionnaire.clusters[1]; if (value === 'CLUSTER 2') return assets.questionnaire.clusters[2]; return '' }

export default App
