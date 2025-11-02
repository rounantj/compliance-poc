import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { consultarCompleta } from '@/lib/bigdata';
import { analisarCompliance } from '@/lib/openai';
import { createComplianceReport } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { documento, focoAnalise } = await req.json();

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento é obrigatório' },
        { status: 400 }
      );
    }

    // Limpar documento
    const documentoLimpo = documento.replace(/\D/g, '');

    if (documentoLimpo.length !== 11 && documentoLimpo.length !== 14) {
      return NextResponse.json(
        { error: 'CPF ou CNPJ inválido' },
        { status: 400 }
      );
    }

    // 1. Consultar BigData
    const consultaCompleta = await consultarCompleta(documentoLimpo);

    // 2. Analisar com OpenAI (passando o foco se fornecido)
    const analiseCompliance = await analisarCompliance(consultaCompleta, focoAnalise);

    // 3. Salvar no banco
    const documentoTipo = consultaCompleta.documentoPrincipal.tipo;
    const documentoNumero = consultaCompleta.documentoPrincipal.numero;
    const documentosRelacionados = consultaCompleta.documentosRelacionados
      .map(d => d.numero)
      .join(',');

    const result = createComplianceReport(
      user.id,
      documentoTipo,
      documentoNumero,
      documentosRelacionados,
      JSON.stringify(consultaCompleta),
      JSON.stringify(analiseCompliance),
      analiseCompliance.nivelRisco
    );

    return NextResponse.json({
      success: true,
      reportId: result.lastInsertRowid,
      consulta: consultaCompleta,
      analise: analiseCompliance,
    });
  } catch (error: any) {
    console.error('Erro na consulta:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar consulta' },
      { status: 500 }
    );
  }
}
