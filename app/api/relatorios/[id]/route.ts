import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getReportById } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const reportId = parseInt(params.id);

    const report = getReportById(reportId, user.id);

    if (!report) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const parsedReport = {
      ...report,
      bigdata_payload: JSON.parse(report.bigdata_payload),
      compliance_analysis: JSON.parse(report.compliance_analysis),
    };

    return NextResponse.json({
      success: true,
      report: parsedReport,
    });
  } catch (error: any) {
    console.error('Erro ao buscar relatório:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar relatório' },
      { status: 500 }
    );
  }
}
