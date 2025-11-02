export interface BigDataResponse {
  Result: any[];
  QueryId: string;
  ElapsedMilliseconds: number;
  QueryDate: string;
  Status: any;
  Evidences?: any;
}

export interface ConsultaCompleta {
  documentoPrincipal: {
    tipo: 'CPF' | 'CNPJ';
    numero: string;
    dados: any;
  };
  documentosRelacionados: Array<{
    tipo: 'CPF' | 'CNPJ';
    numero: string;
    dados: any;
    relacao: string;
  }>;
}

const BASE_URL = 'https://plataforma.bigdatacorp.com.br';

async function consultarBigData(endpoint: string, documento: string): Promise<BigDataResponse> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'AccessToken': process.env.TOKEN_KEY!,
      'TokenId': process.env.TOKEN_ID!,
    },
    body: JSON.stringify({
      q: `doc{${documento}}`,
      Datasets: 'basic_data',
    }),
  });

  if (!response.ok) {
    throw new Error(`BigData API error: ${response.status}`);
  }

  return response.json();
}

export async function consultarCPF(cpf: string): Promise<BigDataResponse> {
  return consultarBigData('/pessoas', cpf);
}

export async function consultarCNPJ(cnpj: string): Promise<BigDataResponse> {
  return consultarBigData('/empresas', cnpj);
}

function extrairCPFsDoCNPJ(dadosCNPJ: any): string[] {
  const cpfs: string[] = [];
  
  // Extrair CPF do proprietário (MEI)
  if (dadosCNPJ.Result?.[0]?.BasicData?.OfficialName) {
    const officialName = dadosCNPJ.Result[0].BasicData.OfficialName;
    const cpfMatch = officialName.match(/\d{11}/);
    if (cpfMatch) {
      cpfs.push(cpfMatch[0]);
    }
  }

  // Extrair CPFs de sócios (se houver dados de QSA)
  if (dadosCNPJ.Result?.[0]?.Shareholders) {
    dadosCNPJ.Result[0].Shareholders.forEach((socio: any) => {
      if (socio.TaxIdNumber && socio.TaxIdNumber.length === 11) {
        cpfs.push(socio.TaxIdNumber);
      }
    });
  }

  return [...new Set(cpfs)]; // Remove duplicatas
}

function extrairCNPJsDoCPF(dadosCPF: any): string[] {
  const cnpjs: string[] = [];

  // Extrair CNPJs de empresas relacionadas
  if (dadosCPF.Result?.[0]?.Companies) {
    dadosCPF.Result[0].Companies.forEach((empresa: any) => {
      if (empresa.TaxIdNumber && empresa.TaxIdNumber.length === 14) {
        cnpjs.push(empresa.TaxIdNumber);
      }
    });
  }

  // Extrair CNPJs de relacionamentos econômicos
  if (dadosCPF.Result?.[0]?.EconomicRelationships) {
    dadosCPF.Result[0].EconomicRelationships.forEach((rel: any) => {
      if (rel.CompanyTaxId && rel.CompanyTaxId.length === 14) {
        cnpjs.push(rel.CompanyTaxId);
      }
    });
  }

  return [...new Set(cnpjs)]; // Remove duplicatas
}

export async function consultarCompleta(documento: string): Promise<ConsultaCompleta> {
  const limpo = documento.replace(/\D/g, '');
  const tipo = limpo.length === 11 ? 'CPF' : 'CNPJ';

  const resultado: ConsultaCompleta = {
    documentoPrincipal: {
      tipo,
      numero: limpo,
      dados: null,
    },
    documentosRelacionados: [],
  };

  try {
    // Consultar documento principal
    if (tipo === 'CPF') {
      const dadosCPF = await consultarCPF(limpo);
      resultado.documentoPrincipal.dados = dadosCPF;

      // Extrair e consultar CNPJs relacionados
      const cnpjs = extrairCNPJsDoCPF(dadosCPF);
      
      for (const cnpj of cnpjs.slice(0, 5)) { // Limitar a 5 CNPJs para não sobrecarregar
        try {
          const dadosCNPJ = await consultarCNPJ(cnpj);
          resultado.documentosRelacionados.push({
            tipo: 'CNPJ',
            numero: cnpj,
            dados: dadosCNPJ,
            relacao: 'Empresa relacionada',
          });
        } catch (error) {
          console.error(`Erro ao consultar CNPJ ${cnpj}:`, error);
        }
      }
    } else {
      const dadosCNPJ = await consultarCNPJ(limpo);
      resultado.documentoPrincipal.dados = dadosCNPJ;

      // Extrair e consultar CPFs relacionados
      const cpfs = extrairCPFsDoCNPJ(dadosCNPJ);
      
      for (const cpf of cpfs.slice(0, 5)) { // Limitar a 5 CPFs
        try {
          const dadosCPF = await consultarCPF(cpf);
          resultado.documentosRelacionados.push({
            tipo: 'CPF',
            numero: cpf,
            dados: dadosCPF,
            relacao: 'Sócio/Proprietário',
          });
        } catch (error) {
          console.error(`Erro ao consultar CPF ${cpf}:`, error);
        }
      }
    }

    return resultado;
  } catch (error) {
    console.error('Erro na consulta completa:', error);
    throw error;
  }
}

