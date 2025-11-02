# Complyance - Sistema de Análise de Compliance

Sistema completo de análise de compliance e due diligence para pessoas físicas e jurídicas, utilizando inteligência artificial.

## 🚀 Tecnologias

- **Next.js 14+** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Ant Design** - Biblioteca de componentes UI
- **NextAuth.js** - Autenticação com Google
- **SQLite** - Banco de dados local
- **OpenAI GPT-4o-mini** - Análise de compliance
- **BigData Corp API** - Dados cadastrais

## 📋 Funcionalidades

### 1. Autenticação

- Login com Google OAuth
- Sessões persistentes em SQLite
- Middleware de proteção de rotas

### 2. Consultoria

- Input de CPF ou CNPJ
- Consulta automática na API BigData Corp
- Busca cruzada de documentos relacionados:
  - CPF → busca CNPJs relacionados
  - CNPJ → busca CPFs de sócios/proprietários
- Análise completa de compliance via OpenAI
- Visualização detalhada dos resultados

### 3. Relatórios

- Histórico de todas as análises realizadas
- Estatísticas agregadas
- Visualização individual de relatórios
- Filtros e paginação

## 🛠️ Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Suas variáveis de ambiente já devem estar no arquivo `.env`:

```env
# BigData Corp API
TOKEN_ID=seu_token_id_aqui
TOKEN_KEY=seu_token_key_aqui

# OpenAI API
OPENAI_API_KEY=sua_chave_openai_aqui

# JWT Secret (opcional, usa padrão se não configurar)
JWT_SECRET=sua_chave_secreta_super_segura
```

### 3. Inicializar o banco de dados

```bash
npm run db:init
```

### 4. Executar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### 5. Fazer login

Use as credenciais padrão:

- **Email:** admin@teste.com
- **Senha:** mdt1234@

## 📁 Estrutura do Projeto

```
complyance/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts             # Login
│   │   │   ├── logout/route.ts            # Logout
│   │   │   └── session/route.ts           # Sessão atual
│   │   ├── consulta/route.ts               # API de consulta
│   │   └── relatorios/
│   │       ├── route.ts                    # Lista relatórios
│   │       └── [id]/route.ts               # Relatório individual
│   ├── consultoria/page.tsx                # Página de consulta
│   ├── relatorios/page.tsx                 # Página de relatórios
│   ├── login/page.tsx                      # Página de login
│   ├── layout.tsx                          # Layout raiz
│   ├── globals.css                         # Estilos globais
│   └── page.tsx                            # Redirect para /login
├── components/
│   ├── AuthProvider.tsx                    # Provider NextAuth
│   └── AppLayout.tsx                       # Layout principal
├── lib/
│   ├── auth.ts                             # Autenticação JWT
│   ├── db.ts                               # Operações SQLite
│   ├── bigdata.ts                          # Cliente BigData API
│   └── openai.ts                           # Cliente OpenAI
├── scripts/
│   └── init-db.js                          # Script inicialização DB
├── types/
│   └── next-auth.d.ts                      # Types NextAuth
├── middleware.ts                           # Middleware autenticação
├── package.json
├── tsconfig.json
├── next.config.js
└── .env
```

## 🔄 Fluxo de Análise

1. **Input**: Usuário insere CPF ou CNPJ
2. **Consulta Principal**: Sistema consulta documento na BigData Corp API
3. **Consultas Relacionadas**:
   - Se CPF: busca CNPJs de empresas relacionadas
   - Se CNPJ: busca CPFs de sócios/proprietários
4. **Análise IA**: Envia dados completos para OpenAI GPT-4o-mini
5. **Resposta**: IA retorna análise estruturada de compliance
6. **Persistência**: Salva relatório no SQLite
7. **Visualização**: Exibe resultado formatado com Ant Design

## 📊 Estrutura do Banco de Dados

### Tabela: users

```sql
- id (INTEGER PRIMARY KEY)
- email (TEXT UNIQUE)
- name (TEXT)
- image (TEXT)
- google_id (TEXT UNIQUE)
- created_at (DATETIME)
- last_login (DATETIME)
```

### Tabela: sessions

```sql
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER)
- session_token (TEXT UNIQUE)
- expires (DATETIME)
- created_at (DATETIME)
```

### Tabela: compliance_reports

```sql
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER)
- document_type (TEXT)
- document_number (TEXT)
- related_documents (TEXT)
- bigdata_payload (TEXT)
- compliance_analysis (TEXT)
- risk_level (TEXT)
- created_at (DATETIME)
```

## 🎨 Design System

O projeto utiliza **Ant Design** com tema customizado:

- Cores primárias: Azul (#1890ff)
- Layout responsivo
- Componentes profissionais
- Skeletons em estados de loading
- Feedback visual consistente

## 🔒 Segurança

- Autenticação via email/senha com JWT
- Senhas hasheadas com bcrypt
- Cookies HTTP-only
- Middleware de proteção de rotas
- API Keys em variáveis de ambiente
- Dados sensíveis não expostos no cliente

## 🚀 Build e Deploy

### Build de produção

```bash
npm run build
```

### Executar produção

```bash
npm start
```

### Variáveis de ambiente em produção

Não esqueça de configurar:

- `NEXTAUTH_URL` com a URL de produção
- `NEXTAUTH_SECRET` com um secret forte
- Atualizar redirect URIs no Google Cloud Console

## 📝 Licença

Privado e confidencial.

---

**Desenvolvido para análises profissionais de compliance e due diligence.**
