# Guia de Rastreamento UTM - Design para Estética

## 🎯 Como Funciona o Sistema UTM

O sistema agora captura automaticamente os UTMs das suas campanhas do Hotmart e outros anúncios, permitindo rastrear o retorno de cada campanha específica.

## 📋 O que foi Implementado

### 1. Script UTMify (Hotmart)
- Script oficial do Hotmart carregado automaticamente
- Captura UTMs de campanhas do Hotmart
- Funciona em tempo real

### 2. Sistema de Rastreamento
- Campo `utm_campaign` na tabela de investimentos
- API para estatísticas por campanha
- Interface para visualizar performance por UTM

### 3. UTM Debugger
- Monitor em tempo real na página de monetização
- Mostra UTMs capturados da URL atual
- Útil para testar campanhas

## 🚀 Como Usar

### Passo 1: URLs de Campanha
Configure suas campanhas com UTMs:
```
https://designparaestetica.com.br?utm_source=facebook&utm_medium=cpc&utm_campaign=botox_janeiro_2025
```

### Passo 2: Monitoramento
1. Acesse o painel de monetização admin
2. Veja o "UTM Debugger" no topo da página
3. Teste adicionando UTMs na URL atual

### Passo 3: Análise de Performance
- Na aba "Investimentos em Tráfego" você vê todos os UTMs
- Seção "Performance por UTM Campaign" mostra estatísticas
- Compare ROAS entre diferentes campanhas

## 📊 Exemplos de Campanhas

### Facebook Ads - Botox
```
utm_source=facebook
utm_medium=cpc  
utm_campaign=botox_promocao_janeiro
```
**String do banco:** `facebook_cpc_botox_promocao_janeiro`

### Google Ads - Harmonização
```
utm_source=google
utm_medium=cpc
utm_campaign=harmonizacao_facial_sp
```
**String do banco:** `google_cpc_harmonizacao_facial_sp`

### Instagram - Preenchimento
```
utm_source=instagram
utm_medium=story
utm_campaign=preenchimento_verao
```
**String do banco:** `instagram_story_preenchimento_verao`

## 🎛️ Funcionalidades

### Dados de Teste Já Criados
- `facebook_ads_botox`: R$ 270,00 (2 investimentos)
- `google_ads_harmonizacao`: R$ 380,00 (2 investimentos)
- `instagram_ads_preenchimento`: R$ 250,00 (1 investimento)

### APIs Disponíveis
- `GET /api/admin/traffic-investments` - Lista investimentos (com UTM)
- `GET /api/admin/traffic-investments/utm-stats` - Estatísticas por UTM
- `POST /api/admin/traffic-investments` - Criar investimento (com UTM)

### Interface
- Tabela de investimentos mostra coluna "UTM Campaign"
- Seção específica para performance por campanha
- UTM Debugger para testes em tempo real

## 🔧 Próximos Passos

1. **Teste o Sistema**: Acesse a URL com UTMs para ver a captura funcionando
2. **Configure Campanhas**: Use UTMs padronizados nas suas campanhas
3. **Analise Dados**: Compare performance entre diferentes fontes
4. **Otimize ROAS**: Identifique campanhas mais rentáveis

## 📝 Exemplo Prático

1. Acesse: `https://seudominio.com?utm_source=facebook&utm_medium=cpc&utm_campaign=botox_teste`
2. Vá para Admin > Monetização  
3. Veja o UTM Debugger detectar os parâmetros
4. Ao adicionar investimentos, o UTM será automaticamente associado
5. Compare performance na seção "Performance por UTM Campaign"

---

**Integração Completa**: UTMify (Hotmart) + Sistema Próprio + Analytics em Tempo Real