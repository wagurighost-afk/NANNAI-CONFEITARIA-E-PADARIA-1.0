import type { Employee } from '@/features/employees/types/employee.types'
import { generateCorporateEmail } from '@/features/employees/utils/employeeEmail'
import {
  getProductionDivisionByEmployeeId,
  toEmployeeProductionItems,
} from '@/features/production/data/productionDivision.data'

function history(
  items: Array<{ date: string; title: string; description: string }>,
): Employee['history'] {
  return items.map((item, index) => ({
    id: `hist-${index + 1}`,
    ...item,
  }))
}

function employeeProductions(employeeId: string): Employee['productions'] {
  const division = getProductionDivisionByEmployeeId(employeeId)
  return division ? toEmployeeProductionItems(division.products) : []
}

function checklists(
  items: Array<{ title: string; status: 'Pendente' | 'Concluído' }>,
): Employee['checklists'] {
  return items.map((item, index) => ({
    id: `chk-${index + 1}`,
    ...item,
  }))
}

/**
 * Equipe atual do Nannai (escala operacional).
 * E-mails gerados pela regra isolada em employeeEmail util.
 */
export const EMPLOYEES_MOCK: Employee[] = [
  {
    id: 'emp-david',
    name: 'Devid Oliveira',
    email: generateCorporateEmail('Devid Oliveira', 'Chef de Confeitaria'),
    phone: '(81) 99900-0001',
    position: 'Chef de Confeitaria',
    sector: 'Confeitaria',
    shift: 'Integral',
    status: 'Ativo',
    admissionDate: '2018-03-12',
    notes: 'Liderança geral da Confeitaria e Padaria. Gestão de escalas e qualidade.',
    productions: employeeProductions('emp-david'),
    checklists: checklists([
      { title: 'Abertura supervisão geral', status: 'Concluído' },
      { title: 'Fechamento qualidade', status: 'Pendente' },
    ]),
    history: history([
      {
        date: '2026-07-18',
        title: 'Revisão de escala',
        description: 'Ajustou substituições da madrugada (Elenilson em férias).',
      },
      {
        date: '2026-07-10',
        title: 'Novo produto',
        description: 'Validou ficha técnica de sobremesa degustação.',
      },
    ]),
  },
  {
    id: 'emp-adriana',
    name: 'Adriana dos Santos',
    email: generateCorporateEmail('Adriana dos Santos', 'Confeiteiro'),
    phone: '(81) 99900-0002',
    position: 'Confeiteiro',
    sector: 'Confeitaria',
    shift: 'Manhã',
    status: 'Ativo',
    admissionDate: '2019-06-01',
    notes: 'Buffet jantar e praça de sorvetes.',
    productions: employeeProductions('emp-adriana'),
    checklists: checklists([
      { title: 'Abertura Confeitaria', status: 'Concluído' },
      { title: 'Checagem praça sorvetes', status: 'Pendente' },
    ]),
    history: history([
      {
        date: '2026-07-17',
        title: 'Produção sorvetes',
        description: 'Reposou sabores fixos e veganos do dia.',
      },
    ]),
  },
  {
    id: 'emp-hosana',
    name: 'Hosana da Conceição',
    email: generateCorporateEmail('Hosana da Conceição', 'Confeiteiro'),
    phone: '(81) 99900-0003',
    position: 'Confeiteiro',
    sector: 'Confeitaria',
    shift: 'Manhã',
    status: 'Ativo',
    admissionDate: '2019-08-15',
    notes: 'Quindim, brownies, bolos e granola.',
    productions: employeeProductions('emp-hosana'),
    checklists: checklists([
      { title: 'Abertura bancadas', status: 'Concluído' },
      { title: 'Etiquetagem validade', status: 'Concluído' },
    ]),
    history: history([
      {
        date: '2026-07-16',
        title: 'Produção quindim',
        description: 'Lote de quindim tradicional e frutas vermelhas.',
      },
    ]),
  },
  {
    id: 'emp-larissa',
    name: 'Larissa Maximiano',
    email: generateCorporateEmail('Larissa Maximiano', 'Auxiliar de Confeitaria'),
    phone: '(81) 99900-0004',
    position: 'Auxiliar de Confeitaria',
    sector: 'Confeitaria',
    shift: 'Manhã',
    status: 'Ativo',
    admissionDate: '2021-02-10',
    notes: 'Muffins, chá da tarde e eventos.',
    productions: employeeProductions('emp-larissa'),
    checklists: checklists([
      { title: 'Montagem Chá da Tarde', status: 'Pendente' },
    ]),
    history: history([
      {
        date: '2026-07-15',
        title: 'Evento coffee break',
        description: 'Apoiou montagem de coffee break do salão.',
      },
    ]),
  },
  {
    id: 'emp-silvana',
    name: 'Silvana',
    email: generateCorporateEmail('Silvana', 'Confeiteiro'),
    phone: '(81) 99900-0005',
    position: 'Confeiteiro',
    sector: 'Confeitaria',
    shift: 'Manhã',
    status: 'Ativo',
    admissionDate: '2020-11-03',
    notes: 'Linha de restrição: vegano, diet e sem glúten.',
    productions: employeeProductions('emp-silvana'),
    checklists: checklists([
      { title: 'Estoque restrição', status: 'Concluído' },
    ]),
    history: history([
      {
        date: '2026-07-14',
        title: 'Estoque bisquit',
        description: 'Repôs bisquit de amêndoas e chocolate em placa.',
      },
    ]),
  },
  {
    id: 'emp-helena',
    name: 'Maria Helena',
    email: generateCorporateEmail('Maria Helena', 'Confeiteiro'),
    phone: '(81) 99900-0006',
    position: 'Confeiteiro',
    sector: 'Confeitaria',
    shift: 'Tarde',
    status: 'Ativo',
    admissionDate: '2018-09-20',
    notes: 'Sobremesas finas do jantar e decorações de chocolate.',
    productions: employeeProductions('emp-helena'),
    checklists: checklists([
      { title: 'Praça jantar', status: 'Pendente' },
    ]),
    history: history([
      {
        date: '2026-07-17',
        title: 'Entremet',
        description: 'Finalizou entremets do cardápio do jantar.',
      },
    ]),
  },
  {
    id: 'emp-matheus',
    name: 'Matheus da Silva',
    email: generateCorporateEmail('Matheus da Silva', 'Confeiteiro'),
    phone: '(81) 99900-0007',
    position: 'Confeiteiro',
    sector: 'Confeitaria',
    shift: 'Tarde',
    status: 'Ativo',
    admissionDate: '2022-04-18',
    notes: 'Quebra-quebra, creme brûlée e menu degustação.',
    productions: employeeProductions('emp-matheus'),
    checklists: checklists([
      { title: 'Montagem verrines', status: 'Concluído' },
    ]),
    history: history([
      {
        date: '2026-07-11',
        title: 'Menu degustação',
        description: 'Apoiou produção do jantar degustação de sexta.',
      },
    ]),
  },
  {
    id: 'emp-rafaela',
    name: 'Jessica Rafaela',
    email: generateCorporateEmail('Jessica Rafaela', 'Auxiliar de Confeitaria'),
    phone: '(81) 99900-0008',
    position: 'Auxiliar de Confeitaria',
    sector: 'Confeitaria',
    shift: 'Tarde',
    status: 'Ativo',
    admissionDate: '2021-07-05',
    notes: 'Geleias, cremes, pudins e montagem da Cartola.',
    productions: employeeProductions('emp-rafaela'),
    checklists: checklists([
      { title: 'Produção geleias', status: 'Concluído' },
    ]),
    history: history([
      {
        date: '2026-07-13',
        title: 'Pudins',
        description: 'Produziu linha de pudins do buffet.',
      },
    ]),
  },
  {
    id: 'emp-mauro',
    name: 'Mauro José',
    email: generateCorporateEmail('Mauro José', 'Auxiliar de Confeitaria'),
    phone: '(81) 99900-0009',
    position: 'Auxiliar de Confeitaria',
    sector: 'Confeitaria',
    shift: 'Tarde',
    status: 'Ativo',
    admissionDate: '2017-05-22',
    notes: 'Amenidades, recheios e liderança de praça.',
    productions: employeeProductions('emp-mauro'),
    checklists: checklists([
      { title: 'Supervisão praça tarde', status: 'Concluído' },
    ]),
    history: history([
      {
        date: '2026-07-18',
        title: 'Eventos',
        description: 'Coordenou montagem de piquenique e coffee break.',
      },
    ]),
  },
  {
    id: 'emp-thayse',
    name: 'Thayse Brunele',
    email: generateCorporateEmail('Thayse Brunele', 'Auxiliar de Confeitaria'),
    phone: '(81) 99900-0010',
    position: 'Auxiliar de Confeitaria',
    sector: 'Confeitaria',
    shift: 'Tarde',
    status: 'Ativo',
    admissionDate: '2022-01-12',
    notes: 'Bolos regionais, cookies e Café Tiatê.',
    productions: employeeProductions('emp-thayse'),
    checklists: checklists([
      { title: 'Bases de tartelete', status: 'Pendente' },
    ]),
    history: history([
      {
        date: '2026-07-12',
        title: 'Cookies',
        description: 'Produziu três variedades de cookies artesanais.',
      },
    ]),
  },
  {
    id: 'emp-vinicius',
    name: 'Glaydson Vinicius',
    email: generateCorporateEmail('Glaydson Vinicius', 'Auxiliar de Padaria'),
    phone: '(81) 99900-0011',
    position: 'Auxiliar de Padaria',
    sector: 'Padaria',
    shift: 'Tarde',
    status: 'Ativo',
    admissionDate: '2019-01-08',
    notes: 'Padaria tarde — reposição, polvilho e montagem jantar.',
    productions: employeeProductions('emp-vinicius'),
    checklists: checklists([
      { title: 'Abertura Padaria manhã', status: 'Concluído' },
    ]),
    history: history([
      {
        date: '2026-07-18',
        title: 'Levain',
        description: 'Alimentou prefermento e produziu linha de pães naturais.',
      },
    ]),
  },
  {
    id: 'emp-williamys',
    name: 'Wiliamys Monteiro',
    email: generateCorporateEmail('Wiliamys Monteiro', 'Padeiro'),
    phone: '(81) 99900-0012',
    position: 'Padeiro',
    sector: 'Padaria',
    shift: 'Manhã',
    status: 'Ativo',
    admissionDate: '2020-03-16',
    notes: 'Folhados e reposição do café da manhã.',
    productions: employeeProductions('emp-williamys'),
    checklists: checklists([
      { title: 'Reposição café da manhã', status: 'Concluído' },
    ]),
    history: history([
      {
        date: '2026-07-17',
        title: 'Chá da tarde',
        description: 'Apoiou reposição rápida do chá da tarde.',
      },
    ]),
  },
  {
    id: 'emp-romario',
    name: 'Romario Tributino',
    email: generateCorporateEmail('Romario Tributino', 'Padeiro'),
    phone: '(81) 99900-0013',
    position: 'Padeiro',
    sector: 'Padaria',
    shift: 'Madrugada',
    status: 'Ativo',
    admissionDate: '2021-09-01',
    notes: 'Cobertura temporária da madrugada (férias Elenilson).',
    productions: employeeProductions('emp-romario'),
    checklists: checklists([
      { title: 'Abertura madrugada', status: 'Concluído' },
    ]),
    history: history([
      {
        date: '2026-07-18',
        title: 'Substituição',
        description: 'Assumiu praça da madrugada com Luciano.',
      },
    ]),
  },
  {
    id: 'emp-luciano',
    name: 'Luciano Marcelino',
    email: generateCorporateEmail('Luciano Marcelino', 'Padeiro'),
    phone: '(81) 99900-0014',
    position: 'Padeiro',
    sector: 'Padaria',
    shift: 'Madrugada',
    status: 'Ativo',
    admissionDate: '2018-11-28',
    notes: 'Produção de madrugada e panificação mini.',
    productions: employeeProductions('emp-luciano'),
    checklists: checklists([
      { title: 'Fechamento madrugada', status: 'Pendente' },
    ]),
    history: history([
      {
        date: '2026-07-17',
        title: 'Discos de pizza',
        description: 'Produziu discos pré-assados tradicional e sem glúten.',
      },
    ]),
  },
  {
    id: 'emp-paulo',
    name: 'Paulo Ricardo',
    email: generateCorporateEmail('Paulo Ricardo', 'Padeiro'),
    phone: '(81) 99900-0015',
    position: 'Padeiro',
    sector: 'Padaria',
    shift: 'Tarde',
    status: 'Ativo',
    admissionDate: '2020-07-14',
    notes: 'Pães de forma, hot dog e apoio ao chá da tarde.',
    productions: employeeProductions('emp-paulo'),
    checklists: checklists([
      { title: 'Desmontagem Chá da Tarde', status: 'Pendente' },
    ]),
    history: history([
      {
        date: '2026-07-16',
        title: 'Pão brioche',
        description: 'Produziu brioche tradicional e com nozes.',
      },
    ]),
  },
  {
    id: 'emp-elenilson',
    name: 'Elenilson',
    email: generateCorporateEmail('Elenilson', 'Padeiro'),
    phone: '(81) 99900-0016',
    position: 'Padeiro',
    sector: 'Padaria',
    shift: 'Madrugada',
    status: 'Férias',
    admissionDate: '2016-02-02',
    notes: 'Em férias regulamentares. Substituído por Romario e Luciano.',
    productions: employeeProductions('emp-elenilson'),
    checklists: checklists([]),
    history: history([
      {
        date: '2026-07-01',
        title: 'Início de férias',
        description: 'Entrou em gozo de férias. Praça coberta pela equipe.',
      },
    ]),
  },
]
