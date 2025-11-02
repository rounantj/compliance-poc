import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getReportsByUser, getReportsStats } from '@/lib/db';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const reports = getReportsByUser(user.id, limit, offset);
    const stats = getReportsStats(user.id);

    // Parse JSON fields
    const parsedReports = reports.map((report: any) => ({
      ...report,
      bigdata_payload: JSON.parse(report.bigdata_payload),
      compliance_analysis: JSON.parse(report.compliance_analysis),
    }));

    return NextResponse.json({
      success: true,
      reports: parsedReports,
      stats,
    });
  } catch (error: any) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar relatórios' },
      { status: 500 }
    );
  }
}
