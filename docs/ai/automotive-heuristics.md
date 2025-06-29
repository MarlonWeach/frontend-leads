# Premissas Heurísticas Automotivas - IA

## Visão Geral

Este documento define as premissas heurísticas, contextuais e específicas do setor automotivo que devem ser consideradas por todos os sistemas de Inteligência Artificial do projeto. Estas premissas garantem que análises, sugestões e insights sejam relevantes, precisos e acionáveis para campanhas de Lead Ads automotivos.

**Última atualização**: Junho 2025  
**Versão**: 1.0  
**Responsável**: Equipe de IA

---

## 1. Contexto de Negócio Automotivo

### 1.1 Características Fundamentais dos Lead Ads Automotivos

#### Formato e Estrutura
- **Plataforma**: Meta (Facebook/Instagram) Lead Ads
- **Formulário**: Instantâneo, sem redirecionamento
- **Campos Típicos**: Nome, telefone, email, modelo de interesse, período de compra
- **Objetivo Primário**: Capturar leads qualificados para test drive ou compra
- **Jornada do Cliente**: Lead → Contato → Agendamento → Test Drive → Negociação → Venda

#### Segmentação Automotiva
- **Por Categoria**: Econômico, Premium, SUV, Comercial, Luxo
- **Por Público**: Primeira compra, troca, empresarial, familiar
- **Por Interesse**: Test drive, financiamento, seminovos, novos
- **Por Localização**: Proximidade da concessionária, região de atuação

### 1.2 Objetivos de Negócio

#### Primários
- **Máxima Qualidade de Leads**: Interessados reais em adquirir veículos
- **Menor CPL Possível**: Mantendo qualidade e volume adequados
- **Conversão Eficiente**: Lead → Test Drive → Venda
- **ROI Positivo**: Retorno sobre investimento em marketing

#### Secundários
- **Brand Awareness**: Reconhecimento da marca
- **Database Building**: Construção de base de prospects
- **Market Intelligence**: Insights sobre preferências do mercado

---

## 2. Premissas de Qualidade de Lead

### 2.1 Características de Leads de Alta Qualidade

#### Dados Completos e Válidos
- **Nome Completo**: Nome e sobrenome válidos (não "teste", "abc", etc.)
- **Telefone Válido**: Formato brasileiro, DDD válido, não repetido
- **Email Válido**: Formato correto, domínio real (não temporário)
- **Interesse Específico**: Modelo ou categoria específica mencionada

#### Comportamento Indicativo
- **Tempo de Preenchimento**: 30-120 segundos (não muito rápido nem muito lento)
- **Horário de Conversão**: Horários comerciais (8h-18h) têm maior qualidade
- **Dispositivo**: Mobile tem conversão mais alta que desktop
- **Localização**: Próxima à concessionária ou região de atuação

#### Indicadores de Intenção
- **Período de Compra**: "Imediato" ou "3 meses" são mais qualificados
- **Tipo de Interesse**: "Test drive" é mais qualificado que "apenas informações"
- **Histórico**: Primeira interação com a marca (não repetido)

### 2.2 Indicadores de Leads Suspeitos ou Baixa Qualidade

#### Dados Inválidos
- **Nomes Genéricos**: "Teste", "ABC", "123", "Usuário"
- **Telefones Inválidos**: Mesmo número múltiplas vezes, DDD inexistente
- **Emails Temporários**: 10minutemail, temp-mail, etc.
- **Dados Inconsistentes**: Nome masculino com interesse em carro feminino

#### Comportamento Suspeito
- **Preenchimento Muito Rápido**: < 10 segundos (bot ou preenchimento automático)
- **Preenchimento Muito Lento**: > 5 minutos (abandono ou distração)
- **Horários Estranhos**: 2h-6h da manhã (menor intenção real)
- **Múltiplos Leads**: Mesmo IP, mesmo telefone, mesmo email

#### Padrões de Fraude
- **Tráfego Incentivado**: Leads de sites de recompensa ou incentivo
- **Bots**: Preenchimento automático sem interação humana
- **Competição**: Leads de concorrentes tentando saturar o sistema
- **Testes**: Leads de testes internos ou de agências

### 2.3 Métricas de Qualidade Específicas

#### Taxa de Conversão por Etapa
- **Lead → Contato**: 60-80% (leads válidos)
- **Contato → Agendamento**: 40-60% (interesse real)
- **Agendamento → Test Drive**: 70-85% (compromisso)
- **Test Drive → Venda**: 15-30% (conversão final)

#### Indicadores de Qualidade
- **Taxa de Resposta**: % de leads que atendem o telefone
- **Tempo de Primeiro Contato**: < 5 minutos é ideal
- **Taxa de Agendamento**: % de leads que agendam test drive
- **Qualidade do Test Drive**: % que comparecem ao agendamento

---

## 3. Heurísticas de Otimização

### 3.1 Benchmarks de Performance por Categoria

#### Veículos Econômicos
- **CPL Ideal**: R$ 15-35
- **Volume Esperado**: Alto (500-2500 leads/mês)
- **Taxa de Conversão**: 8-15%
- **Público**: Primeira compra, troca por economia
- **Sazonalidade**: Maior procura no início do ano

#### Veículos Premium
- **CPL Ideal**: R$ 45-80
- **Volume Esperado**: Médio (50-200 leads/mês)
- **Taxa de Conversão**: 15-25%
- **Público**: Troca por upgrade, segunda compra
- **Sazonalidade**: Estável ao longo do ano

#### SUVs
- **CPL Ideal**: R$ 35-60
- **Volume Esperado**: Médio-alto (80-300 leads/mês)
- **Taxa de Conversão**: 12-20%
- **Público**: Famílias, troca por espaço
- **Sazonalidade**: Pico no final do ano (férias)

#### Veículos Comerciais
- **CPL Ideal**: R$ 50-70
- **Volume Esperado**: Baixo-médio (40-200 leads/mês)
- **Taxa de Conversão**: 20-35%
- **Público**: Empresários, frotas
- **Sazonalidade**: Maior procura no início do ano fiscal

### 3.2 Melhores Práticas de Segmentação

#### Segmentação por Demografia
- **Idade**: 25-45 anos (maior poder de compra)
- **Gênero**: Varia por categoria (SUVs mais femininos, esportivos mais masculinos)
- **Renda**: Alinhada com categoria do veículo
- **Localização**: Raio de 50km da concessionária

#### Segmentação por Interesse
- **Interesses Automotivos**: Marca específica, categoria, financiamento
- **Comportamento**: Compradores online, pesquisadores de preço
- **Lookalike**: Baseada em compradores anteriores
- **Custom Audiences**: Visitantes do site, leads anteriores

#### Segmentação por Comportamento
- **Frequência de Compra**: Primeira compra vs. troca
- **Tipo de Uso**: Pessoal, familiar, comercial
- **Preferência de Contato**: Telefone, WhatsApp, email
- **Horário de Atividade**: Quando mais ativo online

#### Canal de Origem e Posicionamento
- **Origem do Lead**: Feed, Stories, Reels, posicionamento automático ou manual
- **Impacto no Desempenho**: Cada canal possui variação de CPL e CTR, devendo ser analisado separadamente
- **Objetivo da Campanha**: Priorizar campanhas com objetivo "Geração de Cadastro" e evitar uso equivocado de campanhas de tráfego

#### Distribuição de Público e Público Desalinhado
- **Consistência com a Oferta**: Alinhar renda, localização e perfil demográfico com o ticket médio do veículo
- **Indicadores de Desalinhamento**: Altas taxas de leads não qualificados, CPL muito baixo com baixa conversão, públicos amplos demais

### 3.3 Padrões de Copy e Criativos Efetivos

#### Elementos de Copy Eficazes
- **Urgência**: "Últimas unidades", "Oferta por tempo limitado"
- **Benefícios**: "Economia de combustível", "Segurança familiar"
- **Social Proof**: "Mais vendido da categoria", "Aprovado por X famílias"
- **Call-to-Action**: "Agende seu test drive grátis", "Simule seu financiamento"

#### Criativos Otimizados
- **Imagens**: Veículo em contexto de uso real
- **Vídeos**: Test drive, depoimentos, especificações
- **Formato**: Stories, Reels, posts tradicionais
- **Frequência**: 2-3 posts por semana por campanha

---

## 4. Detecção de Anomalias Específicas

### 4.1 Padrões Suspeitos do Setor Automotivo

#### Anomalias de Volume
- **Pico Inesperado**: > 200% do volume médio sem campanha específica
- **Queda Brusca**: < 50% do volume médio sem mudança de campanha
- **Padrão Irregular**: Variações não explicadas por sazonalidade
- **Concentração Temporal**: Muitos leads em horários estranhos

#### Anomalias de Qualidade
- **CPL Muito Baixo**: < 50% do benchmark da categoria (suspeita de fraude)
- **CPL Muito Alto**: > 200% do benchmark (problema de segmentação)
- **Taxa de Conversão Anômala**: > 40% ou < 5% (suspeita de manipulação)
- **Qualidade Inconsistente**: Variação > 50% na qualidade dos leads

#### Anomalias de Comportamento
- **Preenchimento Muito Rápido**: < 10 segundos (bot)
- **Dados Repetidos**: Mesmo telefone/email múltiplas vezes
- **Padrão de IP**: Muitos leads do mesmo IP
- **Horários Estranhos**: Concentração em horários não comerciais

### 4.2 Limites de Alerta por Métrica

#### Alertas Críticos (Ação Imediata)
- **CPL > 200% do benchmark**: Possível problema de segmentação
- **Taxa de Conversão < 5%**: Qualidade muito baixa
- **Volume > 300% do normal**: Possível fraude ou erro
- **Qualidade < 30%**: Muitos leads inválidos

#### Alertas de Atenção (Monitoramento)
- **CPL > 150% do benchmark**: Investigar otimizações
- **Taxa de Conversão < 10%**: Revisar segmentação
- **Volume > 200% do normal**: Verificar campanhas
- **Qualidade < 50%**: Revisar criativos e segmentação

#### Alertas Informativos (Acompanhamento)
- **CPL > 120% do benchmark**: Tendência de aumento
- **Taxa de Conversão < 15%**: Abaixo do esperado
- **Volume > 150% do normal**: Crescimento significativo
- **Qualidade < 70%**: Abaixo do padrão

### 4.3 Tipos de Fraude Comuns

#### Fraude de Tráfego
- **Cliques Falsos**: Bots clicando em anúncios
- **Impressões Falsas**: Visualizações não humanas
- **Conversões Falsas**: Formulários preenchidos automaticamente
- **Retargeting Falso**: Cookies manipulados

#### Fraude de Conversão
- **Leads Duplicados**: Mesma pessoa múltiplas vezes
- **Leads Inválidos**: Dados falsos ou incompletos
- **Leads Incentivados**: Recompensa por preenchimento
- **Leads Competitivos**: Concorrentes saturando o sistema

#### Fraude de Qualidade
- **Leads de Baixa Intenção**: Apenas curiosos, sem intenção de compra
- **Leads de Teste**: Internos ou de agências
- **Leads de Pesquisa**: Apenas comparando preços
- **Leads de Erro**: Preenchimento acidental

---

## 5. Contexto de Análise

### 5.1 Linguagem e Terminologia Específica

#### Termos Técnicos Automotivos
- **CPL**: Custo Por Lead (métrica principal)
- **Test Drive**: Experiência de direção do veículo
- **Financiamento**: Opções de pagamento parcelado
- **Seminovo**: Veículo usado com garantia
- **Concessionária**: Revendedora autorizada da marca

#### Termos de Marketing Digital
- **Lead Qualificado**: Interessado real em compra
- **Qualidade de Lead**: Probabilidade de conversão
- **Segmentação**: Definição do público-alvo
- **Criativo**: Material visual do anúncio
- **Copy**: Texto do anúncio

### 5.2 KPIs Prioritários para Análises Automáticas

#### Métricas Primárias
- **CPL (Custo Por Lead)**: Eficiência de aquisição
- **Volume de Leads**: Quantidade de prospects
- **Taxa de Conversão**: % de leads que avançam na jornada
- **Qualidade de Lead**: % de leads válidos e qualificados

#### Métricas Secundárias
- **CTR (Click Through Rate)**: Engajamento com anúncios
- **CPM (Custo Por Mil Impressões)**: Custo de alcance
- **Tempo de Resposta**: Velocidade do primeiro contato
- **Taxa de Agendamento**: % de leads que agendam test drive

#### Métricas de Negócio
- **ROI (Return on Investment)**: Retorno sobre investimento
- **CAC (Customer Acquisition Cost)**: Custo de aquisição de cliente
- **LTV (Lifetime Value)**: Valor do cliente ao longo do tempo
- **Taxa de Conversão Final**: Lead → Venda

### 5.3 Sazonalidades e Padrões Temporais

#### Sazonalidade Anual
- **Janeiro-Março**: Pico de vendas (13º salário, férias)
- **Abril-Junho**: Período estável
- **Julho-Setembro**: Queda (inverno, férias escolares)
- **Outubro-Dezembro**: Crescimento (Black Friday, Natal)

#### Sazonalidade Semanal
- **Segunda-Terça**: Maior volume (início da semana)
- **Quarta-Quinta**: Volume médio
- **Sexta**: Queda (final de semana)
- **Sábado-Domingo**: Volume tende a ser mais baixo, mas pode variar conforme o público-alvo e categoria do veículo

### 5.4 Contexto Competitivo e Benchmarks

#### Benchmarks do Setor
- **CPL Médio**: R$ 25-60 (varia por categoria)
- **Taxa de Conversão**: 10-25% (varia por categoria)
- **Tempo de Resposta**: < 5 minutos (padrão ouro)
- **Qualidade de Lead**: > 70% (padrão aceitável)

#### Análise Competitiva
- **Posicionamento**: Comparação com concorrentes diretos
- **Diferenciação**: Vantagens competitivas da marca
- **Preços**: Comparação de preços e condições
- **Serviços**: Diferenciais de atendimento e pós-venda

---

## 6. Implementação Técnica

### 6.1 Configurações de IA

#### Parâmetros de Análise
- **Sensibilidade de Anomalias**: Alta para CPL, média para volume
- **Período de Análise**: 7-30 dias para tendências
- **Thresholds de Alerta**: Baseados nos benchmarks definidos
- **Contexto Temporal**: Considerar sazonalidades

#### Prompts Específicos
- **Análise de Performance**: Incluir contexto automotivo
- **Detecção de Anomalias**: Focar em padrões do setor
- **Sugestões de Otimização**: Baseadas em melhores práticas
- **Chat Assistant**: Conhecimento específico do setor
- **IA Generativa e Feedback Autônomo**: A IA deve ser capaz de propor ajustes de criativo, segmentação e distribuição de verba com base em resultados reais e sugerir hipóteses testáveis

### 6.2 Integração com Sistemas

#### Dados Necessários
- **Histórico de Campanhas**: Performance passada
- **Dados de Leads**: Qualidade e conversão
- **Informações de Veículos**: Categorias e preços
- **Dados de Concorrência**: Benchmarks do mercado

#### APIs e Serviços
- **Meta API**: Dados de campanhas e anúncios
- **CRM**: Informações de leads e vendas
- **Analytics**: Métricas de conversão
- **Market Intelligence**: Dados de mercado

---

## 7. Monitoramento e Atualização

### 7.1 Revisão Periódica

#### Frequência de Atualização
- **Benchmarks**: Mensal (baseado em dados reais)
- **Premissas**: Trimestral (baseado em mudanças de mercado)
- **Configurações**: Semanal (baseado em performance)
- **Alertas**: Diário (baseado em anomalias)

#### Critérios de Revisão
- **Performance**: Se métricas estão dentro do esperado
- **Mercado**: Mudanças no setor automotivo
- **Tecnologia**: Novas funcionalidades da Meta
- **Feedback**: Comentários dos usuários

### 7.2 Feedback Loop

#### Coleta de Feedback
- **Usuários**: Avaliação das análises e sugestões
- **Vendedores**: Qualidade dos leads recebidos
- **Gestores**: ROI das campanhas otimizadas
- **Sistema**: Performance automática das sugestões

#### Processo de Melhoria
- **Análise**: Identificar pontos de melhoria
- **Ajuste**: Modificar premissas e configurações
- **Teste**: Validar mudanças com dados reais
- **Implementação**: Aplicar melhorias em produção

---

## 8. Exemplos Práticos

### 8.1 Caso de Sucesso

#### Cenário
- **Categoria**: SUV Premium
- **CPL Inicial**: R$ 85 (acima do benchmark)
- **Volume**: 50 leads/mês
- **Qualidade**: 60%

#### Análise da IA
- **Problema Identificado**: Segmentação muito ampla
- **Sugestão**: Focar em famílias com filhos 5-15 anos
- **Ação**: Ajustar interesses e demografia

#### Resultado
- **CPL Final**: R$ 55 (dentro do benchmark)
- **Volume**: 45 leads/mês (mantido)
- **Qualidade**: 85% (melhoria significativa)

### 8.2 Detecção de Anomalia

#### Cenário
- **Categoria**: Econômico
- **CPL Normal**: R$ 25
- **CPL Atual**: R$ 8 (anomalia)

#### Análise da IA
- **Anomalia Detectada**: CPL muito baixo
- **Causa Identificada**: Possível tráfego incentivado
- **Evidências**: Horários estranhos, dados repetidos

#### Ação Tomada
- **Alerta**: Notificação imediata para gestor
- **Investigação**: Verificação manual dos leads
- **Correção**: Ajuste de segmentação e criativos

### 8.3 Otimização de Campanha

#### Cenário
- **Campanha**: Test Drive SUV
- **Performance**: CPL R$ 45, conversão 12%

#### Análise da IA
- **Insight**: Melhor performance em horários noturnos
- **Sugestão**: Aumentar orçamento 18h-22h
- **Justificativa**: Público mais qualificado nesse horário

#### Implementação
- **Ajuste**: Redistribuição de orçamento
- **Resultado**: CPL R$ 38, conversão 15%
- **ROI**: Melhoria de 18% na eficiência

---

## 9. Conclusão

Este documento estabelece as premissas fundamentais para que a Inteligência Artificial do projeto forneça análises precisas, relevantes e acionáveis para campanhas de Lead Ads automotivos. A aplicação consistente dessas premissas garante:

- **Qualidade das Análises**: Insights específicos do setor automotivo
- **Precisão das Sugestões**: Otimizações baseadas em dados reais
- **Eficácia da Detecção**: Identificação precisa de anomalias
- **Relevância do Contexto**: Linguagem e métricas apropriadas

A manutenção e atualização regular deste documento é essencial para manter a IA alinhada com as mudanças do mercado e as necessidades do negócio.

---

**Próximos Passos**:
1. Implementar estas premissas nos sistemas de IA
2. Validar com dados reais de campanhas
3. Coletar feedback dos usuários
4. Atualizar periodicamente conforme evolução do mercado 