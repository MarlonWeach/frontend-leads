# FAQ - Inteligência Artificial no Dashboard

## Índice
1. [Configuração e Setup](#configuração-e-setup)
2. [Custos e Billing](#custos-e-billing)
3. [Funcionalidades](#funcionalidades)
4. [Problemas Técnicos](#problemas-técnicos)
5. [Privacidade e Segurança](#privacidade-e-segurança)
6. [Performance e Qualidade](#performance-e-qualidade)

## Configuração e Setup

### P: Como obter uma chave da OpenAI?
**R**: 
1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma conta ou faça login
3. Vá em **API Keys** no menu lateral
4. Clique em **Create new secret key**
5. Copie a chave (será exibida apenas uma vez)
6. Adicione um método de pagamento na seção **Billing**

### P: A chave funciona imediatamente após criação?
**R**: Sim, mas pode haver um delay de alguns minutos. O sistema testará automaticamente a conexão na primeira utilização e exibirá o status no painel de IA.

### P: Preciso de uma conta paga da OpenAI?
**R**: Sim. As funcionalidades de IA requerem acesso à API paga da OpenAI. O crédito gratuito ($5) é muito limitado e se esgota rapidamente com uso real.

### P: Como configurar a chave no projeto?
**R**: Adicione a seguinte linha no arquivo `.env.local` na raiz do projeto:
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
```

### P: Como verificar se a configuração está funcionando?
**R**: Acesse `/performance` e clique no painel "Análise Inteligente". Se configurado corretamente, você verá as opções de análise. Caso contrário, aparecerá uma mensagem de erro.

### P: O que fazer se a chave não funcionar?
**R**: 
1. Verifique se a chave está correta no `.env.local`
2. Confirme que há crédito/billing configurado na conta OpenAI
3. Reinicie o servidor Next.js (`npm run dev`)
4. Verifique logs no console para erros específicos

## Custos e Billing

### P: Quanto custa usar as funcionalidades de IA?
**R**: Varia conforme o uso:
- **Uso Típico** (100 análises/dia): $200-800/mês
- **Uso Intenso** (500 análises/dia): $1,500-3,000/mês
- **Cache implementado** reduz custos em ~40%

### P: Como são calculados os custos?
**R**: Baseado em tokens (palavras) processados:
- **GPT-4**: $0.03 por 1K tokens de entrada, $0.06 por 1K tokens de saída
- **Análise típica**: ~1,500 tokens = ~$0.075 por análise

### P: Como controlar e monitorar gastos?
**R**: 
- Configure alertas no dashboard da OpenAI
- Monitore uso diário no painel do projeto
- Use o cache inteligente (reduz custos significativamente)
- Configure limites mensais na conta OpenAI

### P: Existe limite de uso para evitar custos excessivos?
**R**: Sim, implementamos:
- **100 requests/hora** por usuário
- **500 requests/dia** por usuário
- **Cache de 5 minutos** para análises similares
- **Alertas automáticos** quando custo > $200/dia

### P: Como reduzir custos?
**R**: 
1. **Use o cache**: Evite análises repetitivas
2. **Períodos adequados**: Análises de 7+ dias são mais eficientes
3. **Seja específico**: Perguntas diretas geram respostas menores
4. **Monitore uso**: Revise relatórios de custo regularmente

## Funcionalidades

### P: Quais funcionalidades de IA estão disponíveis?
**R**: 
- 📊 **Análise de Performance**: Explica variações em linguagem natural
- 🔍 **Detecção de Anomalias**: Identifica padrões suspeitos
- 💡 **Sugestões de Otimização**: Recomendações baseadas em dados
- 🤖 **Assistente Virtual**: Chat para dúvidas sobre campanhas

### P: As análises são precisas e confiáveis?
**R**: A IA fornece insights baseados em padrões dos dados, mas é importante:
- ✅ **Sempre validar** sugestões antes de implementar
- ✅ **Usar como apoio** à decisão, não substituto
- ✅ **Considerar contexto** específico do seu negócio
- ❌ **Nunca implementar** automaticamente sem revisão

### P: Como melhorar a qualidade das análises?
**R**: 
- Use **períodos representativos** (mínimo 7 dias)
- Garanta **dados completos** no período analisado
- Seja **específico** nas perguntas do chat
- Forneça **contexto** sobre campanhas especiais ou eventos

### P: O que fazer se a análise não fizer sentido?
**R**: 
1. Verifique se há dados suficientes no período
2. Considere eventos externos (feriados, promoções)
3. Reporte o problema com detalhes específicos
4. Use análise básica como alternativa

### P: Posso confiar nas sugestões de otimização?
**R**: As sugestões são baseadas em padrões de dados, mas:
- ✅ **Analise o contexto** do seu negócio
- ✅ **Teste gradualmente** as mudanças
- ✅ **Monitore resultados** após implementação
- ❌ **Não implemente** múltiplas mudanças simultaneamente

## Problemas Técnicos

### P: Erro "Rate limit exceeded" - o que fazer?
**R**: 
- **Aguarde 1 minuto** e tente novamente
- O sistema tem **retry automático** com backoff
- Se persistir, considere **upgrade do plano** OpenAI
- Verifique se não há **uso excessivo** simultâneo

### P: Análises muito lentas ou timeout?
**R**: 
- **Normal**: 2-5 segundos para análises típicas
- **Lento**: Pode ser pico de tráfego na OpenAI
- **Timeout**: Reduza o período de análise
- **Persistente**: Verifique status em status.openai.com

### P: Erro de autenticação "Invalid API Key"?
**R**: 
1. Verifique a chave no arquivo `.env.local`
2. Confirme que não há espaços extras
3. Verifique se a chave não expirou
4. Teste a chave diretamente na OpenAI

### P: Respostas genéricas ou irrelevantes?
**R**: 
- Verifique se há **dados suficientes** no período
- Use **períodos de 7+ dias** para análises
- Seja mais **específico** nas perguntas
- Reporte exemplos específicos para melhoria

### P: Chat não responde ou trava?
**R**: 
1. Verifique conexão com internet
2. Recarregue a página
3. Verifique se não atingiu limite de uso
4. Tente perguntas mais simples e diretas

### P: Como verificar logs de erro?
**R**: 
- **Console do navegador**: F12 → Console
- **Logs do servidor**: Verifique terminal onde roda `npm run dev`
- **Logs específicos**: Procure por "AI Service" ou "OpenAI"

## Privacidade e Segurança

### P: Meus dados são seguros com a OpenAI?
**R**: Sim:
- **OpenAI não treina** modelos com dados via API
- **Não armazena** conversas por padrão
- **Política de privacidade** rigorosa para dados de API
- Veja detalhes em: [OpenAI Privacy Policy](https://openai.com/privacy)

### P: Quais dados são enviados para a IA?
**R**: Apenas **métricas agregadas**:
- ✅ Números de leads, gastos, impressões, cliques
- ✅ Taxas de conversão, CPL, CTR
- ✅ Datas e períodos de análise
- ❌ **NUNCA**: Dados pessoais de leads, emails, telefones

### P: Como garantir que dados sensíveis não sejam enviados?
**R**: O sistema **automaticamente remove**:
- Informações pessoais de leads
- Emails e telefones
- Nomes e endereços
- Qualquer dado identificável
**Apenas métricas agregadas são processadas**

### P: Posso desativar a IA temporariamente?
**R**: Sim, de várias formas:
- **Remover chave**: Delete `OPENAI_API_KEY` do `.env.local`
- **Comentar**: Adicione `#` antes da linha no `.env.local`
- **Reiniciar**: Reinicie o servidor após mudanças
- O sistema funcionará normalmente sem IA

### P: Quem tem acesso às funcionalidades de IA?
**R**: Controle por perfil de usuário:
- **Admin**: Todas as funcionalidades
- **Analyst**: Análises e anomalias
- **Operator**: Chat e alertas básicos
- **Auditoria**: Todos os usos são logados

### P: Os logs de IA são seguros?
**R**: Sim, logs são **sanitizados**:
- ✅ Timestamp, tipo de análise, usuário
- ✅ Tempo de resposta, tokens usados
- ❌ **Nunca**: Dados reais ou respostas completas

## Performance e Qualidade

### P: Quanto tempo demora uma análise?
**R**: 
- **Típico**: 2-5 segundos
- **Máximo**: 30 segundos (timeout automático)
- **Picos**: Pode chegar a 10-15 segundos
- **Cache**: Análises similares são instantâneas

### P: Como funciona o sistema de cache?
**R**: 
- **Duração**: 5 minutos para análises similares
- **Critério**: Mesmo tipo + período + dados
- **Benefício**: Reduz custos em ~40%
- **Transparente**: Usuário não percebe diferença

### P: Por que algumas análises são mais rápidas?
**R**: 
- **Cache hit**: Análise similar recente
- **Dados menores**: Menos tokens para processar
- **Período curto**: Menos dados para analisar
- **Prompt otimizado**: Respostas mais diretas

### P: Como melhorar a velocidade das análises?
**R**: 
- **Use cache**: Evite análises repetitivas
- **Períodos adequados**: Nem muito curto, nem muito longo
- **Seja específico**: Perguntas diretas são mais rápidas
- **Horários**: Evite picos de uso da OpenAI (horário comercial US)

### P: O que fazer se o sistema estiver lento?
**R**: 
1. **Verifique status**: status.openai.com
2. **Tente novamente**: Em alguns minutos
3. **Reduza escopo**: Período menor ou menos dados
4. **Use cache**: Análises similares são mais rápidas

### P: Como reportar problemas de qualidade?
**R**: 
- **Feedback direto**: Use botões de avaliação nas análises
- **Detalhes específicos**: Período, tipo de análise, problema
- **Screenshots**: Se houver erros visuais
- **Contexto**: Explique o que esperava vs o que recebeu

### P: As análises melhoram com o tempo?
**R**: Sim, através de:
- **Feedback dos usuários**: Avaliações e comentários
- **Otimização de prompts**: Baseada em padrões de uso
- **Dados históricos**: Mais contexto melhora precisão
- **Updates da OpenAI**: Modelos são atualizados regularmente

### P: Posso solicitar funcionalidades específicas?
**R**: Sim:
- **Feedback**: Use sistema de avaliação
- **Sugestões**: Descreva funcionalidade desejada
- **Casos de uso**: Explique como ajudaria seu trabalho
- **Priorização**: Baseada em demanda e impacto

---

## Recursos Adicionais

### Documentação Completa
- **[Guia Completo da OpenAI](./openai-guide.md)**: Manual detalhado de uso
- **[Boas Práticas de IA](./ai-best-practices.md)**: Otimização e qualidade
- **[PRD - Seção IA](./prd-lead-ads.md#12-inteligência-artificial---guia-completo)**: Visão técnica completa

### Links Úteis
- [Documentação OpenAI](https://platform.openai.com/docs)
- [Pricing OpenAI](https://openai.com/pricing)
- [Status da API](https://status.openai.com)
- [Política de Privacidade](https://openai.com/privacy)

### Suporte
- **Problemas Técnicos**: Verifique este FAQ primeiro
- **Billing OpenAI**: Suporte direto da OpenAI
- **Funcionalidades**: Sistema de feedback no dashboard

---

**Última atualização**: Junho 2025  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento 