# 🔧 Guia: Configurar Bucket Supabase para Upload de Vídeos

## ❌ Problema Identificado
O bucket 'images' no Supabase está configurado para aceitar apenas:
- `image/png`
- `image/jpeg` 
- `image/webp`
- `image/gif`

Mas precisamos que aceite também:
- `video/mp4` (vídeos MP4)
- `video/webm` (vídeos convertidos)

## 📋 Passo a Passo - Configuração Manual

### 1. Acessar o Painel Supabase
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto "Design para Estética"

### 2. Navegar para Storage
1. No menu lateral esquerdo, clique em **"Storage"**
2. Você verá a lista de buckets, incluindo o bucket **"images"**

### 3. Configurar o Bucket "images"
1. Clique no bucket **"images"** para selecioná-lo
2. No canto superior direito, clique nos **três pontos (⋮)** ou **"Settings"**
3. Selecione **"Edit bucket"** ou **"Configurações"**

### 4. Alterar as Configurações
Na tela de configuração do bucket, você verá:

**Campos a modificar:**

**🔹 Allowed MIME types (Tipos MIME permitidos):**
```
image/png
image/jpeg
image/webp
image/gif
video/mp4
video/webm
video/quicktime
```

**🔹 File size limit (Limite de tamanho):**
```
104857600
```
*(isso é 100MB em bytes)*

**🔹 Public (Público):**
```
✅ Ativado (deve estar marcado)
```

### 5. Salvar as Alterações
1. Clique em **"Save"** ou **"Salvar"**
2. Aguarde a confirmação de que as configurações foram atualizadas

## 🧪 Testar a Configuração

Após salvar, você pode testar fazendo upload de um vídeo MP4 pela sua aplicação.

## 🔄 Alternativa via SQL (Caso não encontre a interface)

Se não conseguir encontrar a opção "Edit bucket", você pode executar este SQL no **SQL Editor** do Supabase:

```sql
-- Atualizar configurações do bucket 'images'
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg', 
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ],
  file_size_limit = 104857600,
  public = true
WHERE id = 'images';
```

## 📍 Localização no Painel

Se você não conseguir encontrar as configurações, procure por:
- **Storage** → **Buckets** → **images** → **⋮** → **Edit**
- **Storage** → **Settings** → **Bucket Configuration**
- **Storage** → **Configuration** → **Bucket Settings**

## ✅ Verificação Final

Após a configuração, você deve ver:
- ✅ Upload de MP4 funcionando sem erro
- ✅ Upload de imagens ainda funcionando normalmente
- ✅ Arquivos sendo salvos corretamente no bucket

## 🚨 Importante

- **NÃO** delete o bucket existente
- **NÃO** altere o nome do bucket (deve continuar sendo "images")
- **APENAS** adicione os novos tipos MIME à lista existente

Se tiver dúvidas, me envie uma captura de tela da tela de configurações do bucket!