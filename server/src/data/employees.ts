export interface SeedEmployee {
  id: string
  name: string
  email: string
  position: string
  role: 'admin' | 'staff'
}

function email(name: string, position: string): string {
  const domain = position === 'Chef de Confeitaria' ? 'nannai.com.br' : 'nannai.net.br'
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
  role: 'admin' | 'staff',
): SeedEmployee {
  return { id, name, email: email(name, position), position, role }
}

export const SEED_EMPLOYEES: SeedEmployee[] = [
  employee('emp-david', 'David Oliveira', 'Chef de Confeitaria', 'admin'),
  employee('emp-adriana', 'Adriana dos Santos', 'Confeiteiro', 'staff'),
  employee('emp-hosana', 'Hosana da Conceição', 'Confeiteiro', 'staff'),
  employee('emp-larissa', 'Larissa Maximiano', 'Confeiteiro', 'staff'),
  employee('emp-silvana', 'Silvana', 'Confeiteiro', 'staff'),
  employee('emp-helena', 'Maria Helena', 'Confeiteiro', 'staff'),
  employee('emp-matheus', 'Mateus da Silva', 'Confeiteiro', 'staff'),
  employee('emp-rafaela', 'Jessica Rafaela', 'Confeiteiro', 'staff'),
  employee('emp-mauro', 'Mauro José', 'Confeiteiro', 'staff'),
  employee('emp-thayse', 'Thayse Brunele', 'Confeiteiro', 'staff'),
  employee('emp-vinicius', 'Glaydson Vinicius', 'Confeiteiro', 'staff'),
  employee('emp-williamys', 'Wiliamys Monteiro', 'Confeiteiro', 'staff'),
  employee('emp-romario', 'Romario Tributino', 'Confeiteiro', 'staff'),
  employee('emp-luciano', 'Luciano Marcelino', 'Confeiteiro', 'staff'),
  employee('emp-paulo', 'Paulo Ricardo', 'Confeiteiro', 'staff'),
  employee('emp-elenilson', 'Elenilson', 'Confeiteiro', 'staff'),
]

export const SEED_ADMIN: SeedEmployee = {
  id: 'usr_nannai_001',
  name: 'Administrador NANNAI',
  email: 'admin@nannai.com',
  position: 'Administrador',
  role: 'admin',
}
