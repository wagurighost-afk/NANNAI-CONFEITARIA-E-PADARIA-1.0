export interface SeedEmployee {
  id: string
  name: string
  email: string
  position: string
  role: import('../auth/roles.js').UserRole
}

const LEADERSHIP_POSITIONS = new Set([
  'Diretor de Operação',
  'Gerente Geral',
  'Chef Executivo',
  'Chef de Confeitaria',
])

function email(name: string, position: string): string {
  const domain = LEADERSHIP_POSITIONS.has(position) ? 'nannai.com.br' : 'nannai.net.br'
  const local = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('.')
  return `${local}@${domain}`
}

function employee(
  id: string,
  name: string,
  position: string,
  role: SeedEmployee['role'],
): SeedEmployee {
  return { id, name, email: email(name, position), position, role }
}

export const SEED_EMPLOYEES: SeedEmployee[] = [
  employee('emp-david', 'Devid Oliveira', 'Chef de Confeitaria', 'founder'),
  employee('emp-adriana', 'Adriana dos Santos', 'Confeiteiro', 'staff'),
  employee('emp-hosana', 'Hosana da Conceição', 'Confeiteiro', 'staff'),
  employee('emp-larissa', 'Larissa Maximiano', 'Auxiliar de Confeitaria', 'staff'),
  employee('emp-silvana', 'Silvana', 'Confeiteiro', 'staff'),
  employee('emp-helena', 'Maria Helena', 'Confeiteiro', 'staff'),
  employee('emp-matheus', 'Matheus da Silva', 'Confeiteiro', 'staff'),
  employee('emp-rafaela', 'Jessica Rafaela', 'Auxiliar de Confeitaria', 'staff'),
  employee('emp-mauro', 'Mauro José', 'Auxiliar de Confeitaria', 'founder'),
  employee('emp-thayse', 'Thayse Brunele', 'Auxiliar de Confeitaria', 'staff'),
  employee('emp-vinicius', 'Glaydson Vinicius', 'Auxiliar de Padaria', 'staff'),
  employee('emp-williamys', 'Wiliamys Monteiro', 'Padeiro', 'staff'),
  employee('emp-romario', 'Romario Tributino', 'Padeiro', 'staff'),
  employee('emp-luciano', 'Luciano Marcelino', 'Padeiro', 'staff'),
  employee('emp-paulo', 'Paulo Ricardo', 'Padeiro', 'staff'),
  employee('emp-elenilson', 'Elenilson', 'Padeiro', 'staff'),
  employee('emp-luciano-bispo', 'Luciano Bispo', 'Confeiteiro', 'staff'),
]

export const SEED_ADMIN: SeedEmployee = {
  id: 'usr_nannai_001',
  name: 'Administrador NANNAI',
  email: 'admin@nannai.com',
  position: 'Administrador',
  role: 'admin',
}
