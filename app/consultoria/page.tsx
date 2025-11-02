'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Descriptions,
  Tag,
  Collapse,
  Statistic,
  Row,
  Col,
  Skeleton,
  Divider,
  Radio,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  BankOutlined,
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  AuditOutlined,
  FundOutlined,
  GlobalOutlined,
  IdcardOutlined,
  ShakeOutlined,
} from '@ant-design/icons';
import AppLayout from '@/components/AppLayout';
import MarkdownContent from '@/components/MarkdownContent';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const FOCOS_SUGERIDOS = [
  {
    key: 'geral',
    label: 'Análise Geral',
    icon: <AuditOutlined />,
    color: 'blue',
    prompt: 'Realize uma análise geral e abrangente de compliance, avaliando todos os aspectos relevantes.',
  },
  {
    key: 'familiares',
    label: 'Relacionamentos Familiares',
    icon: <TeamOutlined />,
    color: 'purple',
    prompt: 'Foque especialmente nos relacionamentos familiares, círculo familiar, parentes envolvidos em empresas ou processos, e possíveis riscos relacionados a familiares.',
  },
  {
    key: 'socios',
    label: 'Quadro Societário',
    icon: <IdcardOutlined />,
    color: 'green',
    prompt: 'Analise detalhadamente o quadro societário, quantidade de sócios, histórico dos sócios, empresas relacionadas e riscos societários.',
  },
  {
    key: 'socios_risco',
    label: 'Riscos dos Sócios',
    icon: <WarningOutlined />,
    color: 'red',
    prompt: 'Foque nos riscos específicos dos sócios e proprietários: processos judiciais, restrições, histórico criminal, PEP, e qualquer irregularidade.',
  },
  {
    key: 'financeiro',
    label: 'Situação Financeira',
    icon: <FundOutlined />,
    color: 'gold',
    prompt: 'Concentre-se na situação financeira, fiscal, débitos, negativações, capacidade financeira e riscos econômicos.',
  },
  {
    key: 'judicial',
    label: 'Processos Judiciais',
    icon: <ShakeOutlined />,
    color: 'orange',
    prompt: 'Analise em profundidade os processos judiciais e administrativos, suas naturezas, valores envolvidos e riscos jurídicos.',
  },
  {
    key: 'reputacao',
    label: 'Reputação e Mídia',
    icon: <GlobalOutlined />,
    color: 'cyan',
    prompt: 'Foque na reputação pública, exposição na mídia, envolvimento político, e impacto reputacional.',
  },
];

export default function ConsultoriaPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [focoSelecionado, setFocoSelecionado] = useState('geral');
  const [focoCustomizado, setFocoCustomizado] = useState('');

  if (authLoading) {
    return (
      <AppLayout>
        <Skeleton active />
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  const handleConsulta = async (values: { documento: string }) => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const focoAtual = FOCOS_SUGERIDOS.find(f => f.key === focoSelecionado);
      const focoFinal = focoCustomizado.trim() || focoAtual?.prompt;

      const response = await fetch('/api/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          documento: values.documento,
          focoAnalise: focoFinal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar consulta');
      }

      setResultado(data);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
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

  return (
    <AppLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            <AuditOutlined /> Análise de Compliance
          </Title>
          <Paragraph type="secondary">
            Análise completa e inteligente de compliance com IA especializada
          </Paragraph>
        </div>

        <Card>
          <Form
            form={form}
            onFinish={handleConsulta}
            layout="vertical"
            disabled={loading}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="documento"
                  label="CPF ou CNPJ"
                  rules={[
                    { required: true, message: 'Documento obrigatório' },
                    { 
                      pattern: /^[\d.\-\/]+$/, 
                      message: 'Digite um CPF ou CNPJ válido' 
                    },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const limpo = value.replace(/\D/g, '');
                        if (limpo.length === 11 || limpo.length === 14) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('CPF deve ter 11 dígitos ou CNPJ 14 dígitos'));
                      }
                    }
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    prefix={<UserOutlined />}
                    maxLength={18}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Foco da Análise</Divider>

            <Radio.Group
              value={focoSelecionado}
              onChange={(e) => {
                setFocoSelecionado(e.target.value);
                if (e.target.value !== 'customizado') {
                  setFocoCustomizado('');
                }
              }}
              style={{ width: '100%', marginBottom: 16 }}
            >
              <Row gutter={[12, 12]}>
                {FOCOS_SUGERIDOS.map((foco) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={foco.key}>
                    <Radio.Button
                      value={foco.key}
                      style={{
                        width: '100%',
                        height: 'auto',
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <Space direction="vertical" size={4}>
                        <span style={{ fontSize: 20 }}>{foco.icon}</span>
                        <Text strong style={{ fontSize: 12 }}>
                          {foco.label}
                        </Text>
                      </Space>
                    </Radio.Button>
                  </Col>
                ))}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Radio.Button
                    value="customizado"
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <Space direction="vertical" size={4}>
                      <span style={{ fontSize: 20 }}>✏️</span>
                      <Text strong style={{ fontSize: 12 }}>
                        Personalizado
                      </Text>
                    </Space>
                  </Radio.Button>
                </Col>
              </Row>
            </Radio.Group>

            {focoSelecionado === 'customizado' && (
              <Form.Item
                label="Descreva o foco específico da sua análise"
                help="Seja específico sobre o que você quer que o compliance analise"
              >
                <TextArea
                  value={focoCustomizado}
                  onChange={(e) => setFocoCustomizado(e.target.value)}
                  placeholder="Exemplo: Analise especialmente o envolvimento com empresas do setor público, contratos governamentais e possíveis conflitos de interesse..."
                  rows={4}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            )}

            {focoSelecionado !== 'customizado' && (
              <Alert
                message="Foco Selecionado"
                description={FOCOS_SUGERIDOS.find(f => f.key === focoSelecionado)?.prompt}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SearchOutlined />}
                loading={loading}
                block
              >
                {loading ? 'Analisando...' : 'Iniciar Análise de Compliance'}
              </Button>
            </Form.Item>
          </Form>

          {error && (
            <Alert
              message="Erro"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}
        </Card>

        {loading && (
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Skeleton active paragraph={{ rows: 2 }} />
              <Skeleton active paragraph={{ rows: 4 }} />
              <Skeleton active paragraph={{ rows: 3 }} />
            </Space>
          </Card>
        )}

        {resultado && resultado.analise && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card
              title={
                <Space>
                  <SafetyOutlined />
                  <span>Resumo Executivo</span>
                </Space>
              }
            >
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="Nível de Risco"
                      value={getRiskText(resultado.analise.nivelRisco)}
                      valueStyle={{ color: getRiskColor(resultado.analise.nivelRisco) === 'success' ? '#3f8600' : getRiskColor(resultado.analise.nivelRisco) === 'warning' ? '#faad14' : '#cf1322' }}
                      prefix={<SafetyOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="Pontuação de Risco"
                      value={resultado.analise.pontuacaoRisco}
                      suffix="/ 100"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card>
                    <Statistic
                      title="Documentos Analisados"
                      value={resultado.analise.documentosAnalisados?.length || 0}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <MarkdownContent content={resultado.analise.resumoExecutivo} />
            </Card>

            {resultado.analise.alertas && resultado.analise.alertas.length > 0 && (
              <Card title={<Space><WarningOutlined />Alertas</Space>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {resultado.analise.alertas.map((alerta: any, index: number) => (
                    <Alert
                      key={index}
                      message={
                        <Space>
                          {getSeverityIcon(alerta.severidade)}
                          <Text strong>{alerta.tipo}</Text>
                        </Space>
                      }
                      description={alerta.descricao}
                      type={alerta.severidade === 'CRITICAL' ? 'error' : alerta.severidade === 'WARNING' ? 'warning' : 'info'}
                      showIcon={false}
                    />
                  ))}
                </Space>
              </Card>
            )}

            <Card title="Análise Detalhada">
              <Collapse defaultActiveKey={['1']}>
                <Panel header="Dados Cadastrais" key="1">
                  <MarkdownContent content={resultado.analise.analiseDetalhada.dadosCadastrais} />
                </Panel>
                <Panel header="Situação Fiscal" key="2">
                  <MarkdownContent content={resultado.analise.analiseDetalhada.situacaoFiscal} />
                </Panel>
                <Panel header="Relacionamentos" key="3">
                  <MarkdownContent content={resultado.analise.analiseDetalhada.relacionamentos} />
                </Panel>
                <Panel header="Processos Judiciais" key="4">
                  <MarkdownContent content={resultado.analise.analiseDetalhada.processosJudiciais} />
                </Panel>
                <Panel header="Reputação" key="5">
                  <MarkdownContent content={resultado.analise.analiseDetalhada.reputacao} />
                </Panel>
              </Collapse>
            </Card>

            {resultado.analise.recomendacoes && resultado.analise.recomendacoes.length > 0 && (
              <Card title={<Space><CheckCircleOutlined />Recomendações</Space>}>
                <ul style={{ paddingLeft: 20 }}>
                  {resultado.analise.recomendacoes.map((rec: string, index: number) => (
                    <li key={index} style={{ marginBottom: 8 }}>
                      <Text>{rec}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title="Informações da Consulta">
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Tipo">
                  {resultado.consulta.documentoPrincipal.tipo === 'CPF' ? (
                    <Tag icon={<UserOutlined />} color="blue">CPF</Tag>
                  ) : (
                    <Tag icon={<BankOutlined />} color="green">CNPJ</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Documento">
                  {resultado.consulta.documentoPrincipal.numero}
                </Descriptions.Item>
                <Descriptions.Item label="Documentos Relacionados">
                  {resultado.consulta.documentosRelacionados.length}
                </Descriptions.Item>
                <Descriptions.Item label="ID do Relatório">
                  #{resultado.reportId}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Button
              type="default"
              size="large"
              onClick={() => router.push('/relatorios')}
              block
            >
              Ver Todos os Relatórios
            </Button>
          </Space>
        )}
      </Space>
    </AppLayout>
  );
}
