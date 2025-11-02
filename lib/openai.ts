import OpenAI from 'openai';
import { ConsultaCompleta } from './bigdata';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ComplianceAnalysis {
  resumoExecutivo: string;
  nivelRisco: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  pontuacaoRisco: number;
  alertas: Array<{
    tipo: string;
    severidade: 'INFO' | 'WARNING' | 'CRITICAL';
    descricao: string;
  }>;
  analiseDetalhada: {
    dadosCadastrais: string;
    situacaoFiscal: string;
    relacionamentos: string;
    processosJudiciais: string;
    reputacao: string;
  };
  recomendacoes: string[];
  documentosAnalisados: string[];
  dataAnalise: string;
}

const COMPLIANCE_PROMPT = `Você é um especialista em compliance, due diligence e análise de risco corporativo e individual. Sua função é analisar dados cadastrais, financeiros e relacionais de pessoas físicas e jurídicas para identificar riscos de compliance, lavagem de dinheiro, fraude, reputação e outros aspectos relevantes.

Analise os dados fornecidos e retorne uma análise COMPLETA E DETALHADA em formato JSON seguindo EXATAMENTE esta estrutura:

{
  "resumoExecutivo": "Resumo executivo em 3-4 parágrafos usando Markdown",
  "nivelRisco": "LOW|MEDIUM|HIGH|CRITICAL",
  "pontuacaoRisco": 0-100,
  "alertas": [
    {
      "tipo": "Tipo do alerta",
      "severidade": "INFO|WARNING|CRITICAL",
      "descricao": "Descrição detalhada"
    }
  ],
  "analiseDetalhada": {
    "dadosCadastrais": "Análise em Markdown formatado",
    "situacaoFiscal": "Análise em Markdown formatado",
    "relacionamentos": "Análise em Markdown formatado",
    "processosJudiciais": "Análise em Markdown formatado",
    "reputacao": "Análise em Markdown formatado"
  },
  "recomendacoes": [
    "Lista de recomendações específicas e acionáveis"
  ],
  "documentosAnalisados": [
    "Lista dos documentos analisados"
  ],
  "dataAnalise": "ISO 8601 timestamp"
}

INSTRUÇÕES DE FORMATAÇÃO MARKDOWN:

1. Use **negrito** para destacar pontos importantes, números-chave e termos críticos
2. Use listas com bullet points (- ) para organizar informações
3. Use ### para subtítulos quando necessário
4. Use > para blockquotes em observações importantes
5. Destaque valores monetários, percentuais e datas em **negrito**
6. Organize informações em parágrafos curtos e escaneáveis
7. Use *itálico* para ênfase secundária

EXEMPLO DE BOA FORMATAÇÃO:

### Status Cadastral
- **CPF**: Ativo na Receita Federal
- **Situação**: Regular
- **Idade**: **35 anos** (nascimento: 13/09/1990)
- **Região Fiscal**: ES-RJ

> ⚠️ **Atenção**: Documento com status PENDENTE DE REGULARIZAÇÃO desde setembro/2025.

**Pontos de Destaque:**
- Nome único com baixa probabilidade de homonímia (**96.6% de unicidade**)
- Cadastro ativo há **19 anos**
- Último update: **20/10/2025**

CRITÉRIOS DE AVALIAÇÃO DE RISCO:

1. CRITICAL (90-100): Impedimentos graves, fraudes confirmadas, processos criminais, PEP com irregularidades
2. HIGH (70-89): Múltiplas irregularidades, processos relevantes, pendências fiscais graves
3. MEDIUM (40-69): Algumas irregularidades, pendências fiscais leves, processos cíveis
4. LOW (0-39): Situação regular, sem pendências significativas

ASPECTOS A ANALISAR:

- Status do CPF/CNPJ (Ativo, Suspenso, Cancelado, Pendente)
- Idade da pessoa/empresa
- Dados cadastrais completos e consistentes
- Relacionamentos societários (sócios, empresas)
- Indicações de PEP (Pessoa Politicamente Exposta)
- Processos judiciais e administrativos
- Situação fiscal e tributária
- Consistência entre dados
- Red flags (sinais de alerta)

Seja profissional, objetivo e baseie-se apenas nos dados fornecidos. Use Markdown para criar uma análise visualmente organizada e fácil de ler. Não invente informações.`;

export async function analisarCompliance(consulta: ConsultaCompleta, focoAnalise?: string): Promise<ComplianceAnalysis> {
  try {
    const payload = JSON.stringify(consulta, null, 2);

    const promptFinal = focoAnalise 
      ? `${COMPLIANCE_PROMPT}\n\nFOCO ESPECÍFICO SOLICITADO: ${focoAnalise}\n\nDê atenção especial a este aspecto na sua análise, mas não deixe de avaliar os outros critérios importantes.`
      : COMPLIANCE_PROMPT;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: promptFinal,
        },
        {
          role: 'user',
          content: `Analise os seguintes dados e retorne a análise de compliance em formato JSON com conteúdo formatado em Markdown:\n\n${payload}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    const analysis: ComplianceAnalysis = JSON.parse(content);
    
    // Validação básica
    if (!analysis.nivelRisco || !analysis.pontuacaoRisco) {
      throw new Error('Análise incompleta da OpenAI');
    }

    // Garantir que dataAnalise está presente
    analysis.dataAnalise = new Date().toISOString();
    
    // Garantir que documentosAnalisados está presente
    if (!analysis.documentosAnalisados) {
      analysis.documentosAnalisados = [
        consulta.documentoPrincipal.numero,
        ...consulta.documentosRelacionados.map(d => d.numero),
      ];
    }

    return analysis;
  } catch (error) {
    console.error('Erro ao analisar compliance:', error);
    throw error;
  }
}
