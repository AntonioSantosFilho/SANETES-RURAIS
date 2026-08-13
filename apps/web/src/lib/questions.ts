import type { Answer } from './api'

export type Question = {
  key: string
  number: number
  displayNumber?: number
  prompt: string
  options: Array<{ label: string; value: string }>
  dateWhen?: string
  dateLabel?: string
  detailLabel?: (answer?: Answer) => string
}

const yesNo = [{ label: 'Sim', value: 'sim' }, { label: 'Não', value: 'não' }]

export const entryQuestions: Question[] = [
  { key: 'q1', number: 1, prompt: 'A amostra da entrada do sistema está turva?', options: yesNo },
  { key: 'q2', number: 2, prompt: 'A amostra da entrada apresenta que tipo de odor?', options: [{ label: 'Odor característico', value: 'Odor característico' }, { label: 'Odor desagradável', value: 'Odor desagradável' }] },
  { key: 'q3', number: 3, prompt: 'A amostra da entrada apresenta espuma?', options: yesNo },
  { key: 'q4', number: 4, prompt: 'A amostra da entrada apresenta óleos e gorduras?', options: yesNo },
  { key: 'q5', number: 5, prompt: 'A caixa de gordura foi limpa?', options: yesNo, dateWhen: 'sim', dateLabel: 'Escolha aqui a data da última limpeza' },
  { key: 'q6', number: 6, prompt: 'Foi descartado lodo do reator UASB?', options: yesNo, dateWhen: 'sim', dateLabel: 'Escolha aqui a data da última limpeza' },
  { key: 'q7', number: 7, prompt: 'A lagoa de estabilização foi esvaziada e o lodo de fundo descartado?', options: yesNo, dateWhen: 'sim', dateLabel: 'Escolha aqui a data da última limpeza' },
]

export const outletPrimaryQuestions: Question[] = [
  { key: 'q8', number: 8, displayNumber: 1, prompt: 'A amostra da saída do sistema está turva?', options: yesNo },
  { key: 'q9', number: 9, displayNumber: 2, prompt: 'A amostra da saída do sistema apresenta que tipo de odor?', options: [{ label: 'Odor característico', value: 'Odor característico' }, { label: 'Odor desagradável', value: 'Odor desagradável' }] },
  { key: 'q10', number: 10, displayNumber: 3, prompt: 'A amostra da saída do sistema apresenta espuma?', options: yesNo },
  { key: 'q11', number: 11, displayNumber: 4, prompt: 'A amostra da saída do sistema apresenta óleos e gorduras?', options: yesNo },
  { key: 'q12', number: 12, displayNumber: 5, prompt: 'Com qual das faixas de cores abaixo sua amostra mais se parece?', options: [
    { label: 'Faixa verde', value: 'CLUSTER 2' },
    { label: 'Faixa marrom', value: 'CLUSTER 1' },
    { label: 'Faixa marrom escuro', value: 'CLUSTER 0' },
    { label: 'Nenhuma das faixas', value: 'NENHUM CLUSTER' },
  ] },
]

export const finalQuestions: Question[] = [
  { key: 'q14', number: 14, displayNumber: 7, prompt: 'Qual o destino do esgoto tratado após a saída do sistema?', options: [{ label: 'Reúso agrícola', value: 'Reúso agrícola' }, { label: 'Outro', value: 'Outro' }], detailLabel: (answer) => answer?.value === 'Reúso agrícola' ? 'Digite aqui qual o tipo de cultura' : 'Digite aqui qual outro uso' },
  { key: 'q15', number: 15, displayNumber: 8, prompt: 'Quantos dias o efluente permanece na lagoa de estabilização?', options: [{ label: 'Menos de 7 dias', value: 'Menos de 7 dias' }, { label: 'Entre 7 e 9 dias', value: 'Entre 7 e 9 dias' }, { label: 'Acima de 9 dias', value: 'Acima de 9 dias' }] },
  { key: 'q16', number: 16, displayNumber: 9, prompt: 'O filtro de linha e gotejadores foram limpos?', options: yesNo, dateWhen: 'sim', dateLabel: 'Escolha aqui a data da última limpeza' },
  { key: 'q17', number: 17, displayNumber: 10, prompt: 'A bomba foi limpa?', options: yesNo, dateWhen: 'sim', dateLabel: 'Escolha aqui a data da última limpeza' },
]

export function q13Options(cluster?: string) {
  if (cluster === 'CLUSTER 2') return [13, 6, 8, 5, 2, 10, 9, 15, 14, 12].map((value, index) => ({ label: `Faixa ${index + 1}`, value: String(value) }))
  if (cluster === 'CLUSTER 1') return [3, 4].map((value, index) => ({ label: `Faixa ${index + 1}`, value: String(value) }))
  if (cluster === 'CLUSTER 0') return [7, 11, 1].map((value, index) => ({ label: `Faixa ${index + 1}`, value: String(value) }))
  return [{ label: 'Nenhuma faixa', value: 'NENHUM CLUSTER' }]
}

export const photoDefinitions = [
  { key: 'greaseTrap', label: 'Caixa de gordura', help: 'Fotografe a caixa de gordura de forma que o efluente esteja visível' },
  { key: 'lagoon', label: 'Lagoa de estabilização', help: 'Fotografe a lagoa de estabilização' },
  { key: 'inletSample', label: 'Amostra da entrada', help: 'Fotografe a amostra coletada na entrada do sistema, evite o uso de flash' },
  { key: 'outletSample', label: 'Amostra da saída', help: 'Fotografe a amostra coletada na saída do sistema, evite o uso de flash' },
] as const
