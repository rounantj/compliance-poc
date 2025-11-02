'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  Statistic,
  Row,
  Col,
  Modal,
  Descriptions,
  Collapse,
  Alert,
  Skeleton,
} from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  SafetyOutlined,
  UserOutlined,
  BankOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import AppLayout from '@/components/AppLayout';
import MarkdownContent from '@/components/MarkdownContent';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface Report {
  id: number;
  document_type: string;
  document_number: string;
  risk_level: string;
  created_at: string;
  compliance_analysis: any;
  bigdata_payload: any;
}

export default function RelatoriosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchReports();
    }
  }, [authLoading, user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/relatorios');
      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getRiskText = (nivel: string) => {
    switch (nivel) {
      case 'LOW': return 'Baixo';
      case 'MEDIUM': return 'Médio';
      case 'HIGH': return 'Alto';
      case 'CRITICAL': return 'Crítico';
      default: return nivel;
    }
  };

  const getSeverityIcon = (severidade: string) => {
    switch (severidade) {
      case 'INFO': return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'WARNING': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'CRITICAL': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      default: return null;
    }
  };

  const columns: ColumnsType<Report> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => `#${id}`,
    },
    {
      title: 'Tipo',
      dataIndex: 'document_type',
      key: 'document_type',
      width: 100,
      render: (type) =>
        type === 'CPF' ? (
          <Tag icon={<UserOutlined />} color="blue">
            CPF
          </Tag>
        ) : (
          <Tag icon={<BankOutlined />} color="green">
            CNPJ
          </Tag>
        ),
    },
    {
      title: 'Documento',
      dataIndex: 'document_number',
      key: 'document_number',
      width: 150,
    },
    {
      title: 'Nível de Risco',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 130,
      render: (risk) => (
        <Tag color={getRiskColor(risk)}>{getRiskText(risk)}</Tag>
      ),
    },
    {
      title: 'Data',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedReport(record);
            setModalVisible(true);
          }}
        >
          Ver
        </Button>
      ),
    },
  ];

  if (authLoading || loading) {
    return (
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Skeleton active />
          <Skeleton active />
          <Skeleton active />
        </Space>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            <FileTextOutlined /> Relatórios de Compliance
          </Title>
          <Paragraph type="secondary">
            Histórico de análises realizadas
          </Paragraph>
        </div>

        {stats && (
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total de Relatórios"
                  value={stats.total_reports}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Consultas CPF"
                  value={stats.cpf_count}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Consultas CNPJ"
                  value={stats.cnpj_count}
                  prefix={<BankOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Alto Risco"
                  value={(stats.high_risk_count || 0) + (stats.critical_risk_count || 0)}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Card>
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} relatórios`,
            }}
          />
        </Card>

        <Modal
          title={
            <Space>
              <SafetyOutlined />
              <span>Relatório #{selectedReport?.id}</span>
            </Space>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          width={1000}
          footer={[
            <Button key="close" onClick={() => setModalVisible(false)}>
              Fechar
            </Button>,
          ]}
        >
          {selectedReport && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Tipo">
                  {selectedReport.document_type === 'CPF' ? (
                    <Tag icon={<UserOutlined />} color="blue">
                      CPF
                    </Tag>
                  ) : (
                    <Tag icon={<BankOutlined />} color="green">
                      CNPJ
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Documento">
                  {selectedReport.document_number}
                </Descriptions.Item>
                <Descriptions.Item label="Nível de Risco">
                  <Tag color={getRiskColor(selectedReport.risk_level)}>
                    {getRiskText(selectedReport.risk_level)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Pontuação">
                  {selectedReport.compliance_analysis.pontuacaoRisco}/100
                </Descriptions.Item>
                <Descriptions.Item label="Data" span={2}>
                  {dayjs(selectedReport.created_at).format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>

              <Card title="Resumo Executivo" size="small">
                <MarkdownContent content={selectedReport.compliance_analysis.resumoExecutivo} />
              </Card>

              {selectedReport.compliance_analysis.alertas?.length > 0 && (
                <Card title="Alertas" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {selectedReport.compliance_analysis.alertas.map((alerta: any, index: number) => (
                      <Alert
                        key={index}
                        message={
                          <Space>
                            {getSeverityIcon(alerta.severidade)}
                            <Text strong>{alerta.tipo}</Text>
                          </Space>
                        }
                        description={alerta.descricao}
                        type={
                          alerta.severidade === 'CRITICAL'
                            ? 'error'
                            : alerta.severidade === 'WARNING'
                            ? 'warning'
                            : 'info'
                        }
                        showIcon={false}
                      />
                    ))}
                  </Space>
                </Card>
              )}

              <Card title="Análise Detalhada" size="small">
                <Collapse>
                  <Panel header="Dados Cadastrais" key="1">
                    <MarkdownContent content={selectedReport.compliance_analysis.analiseDetalhada.dadosCadastrais} />
                  </Panel>
                  <Panel header="Situação Fiscal" key="2">
                    <MarkdownContent content={selectedReport.compliance_analysis.analiseDetalhada.situacaoFiscal} />
                  </Panel>
                  <Panel header="Relacionamentos" key="3">
                    <MarkdownContent content={selectedReport.compliance_analysis.analiseDetalhada.relacionamentos} />
                  </Panel>
                  <Panel header="Processos Judiciais" key="4">
                    <MarkdownContent content={selectedReport.compliance_analysis.analiseDetalhada.processosJudiciais} />
                  </Panel>
                  <Panel header="Reputação" key="5">
                    <MarkdownContent content={selectedReport.compliance_analysis.analiseDetalhada.reputacao} />
                  </Panel>
                </Collapse>
              </Card>

              {selectedReport.compliance_analysis.recomendacoes?.length > 0 && (
                <Card title="Recomendações" size="small">
                  <ul style={{ paddingLeft: 20 }}>
                    {selectedReport.compliance_analysis.recomendacoes.map((rec: string, index: number) => (
                      <li key={index} style={{ marginBottom: 8 }}>
                        <Text>{rec}</Text>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </Space>
          )}
        </Modal>
      </Space>
    </AppLayout>
  );
}
