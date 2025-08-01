// Serviço para gerenciar eventos do Facebook Pixel
// Design para Estética - Plataforma de Artes

declare global {
  interface Window {
    fbq: any;
  }
}

interface PixelEventData {
  content_type?: string;
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  user_data?: {
    email?: string;
    phone?: string;
    first_name?: string;
  };
}

export class FacebookPixelService {
  // Verifica se o pixel está carregado
  static isLoaded(): boolean {
    return typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function';
  }

  // Inicializa o pixel se ainda não estiver carregado
  static init(): void {
    if (typeof window === 'undefined') return;
    
    if (!window.fbq) {
      window.fbq = function() {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
    }
  }

  // Evento: Visualização de conteúdo (arte/design)
  static trackViewContent(data: {
    postId: string;
    title: string;
    category: string;
    format: string;
    isPremium: boolean;
  }) {
    if (!this.isLoaded()) return;

    window.fbq('track', 'ViewContent', {
      content_type: 'product',
      content_ids: [data.postId],
      content_name: data.title,
      content_category: `${data.category} - ${data.format}`,
      value: data.isPremium ? 1 : 0,
      currency: 'BRL'
    });

    console.log('📊 Facebook Pixel: ViewContent tracked', data);
  }

  // Evento: Busca por designs
  static trackSearch(query: string, category?: string) {
    if (!this.isLoaded()) return;

    window.fbq('track', 'Search', {
      search_string: query,
      content_category: category || 'all'
    });

    console.log('📊 Facebook Pixel: Search tracked', { query, category });
  }

  // Evento: Lead (cadastro de usuário)
  static trackLead(userData: {
    email: string;
    name?: string;
    phone?: string;
  }) {
    if (!this.isLoaded()) return;

    window.fbq('track', 'Lead', {
      content_name: 'User Registration',
      user_data: {
        email: userData.email,
        first_name: userData.name,
        phone: userData.phone
      }
    });

    console.log('📊 Facebook Pixel: Lead tracked', userData);
  }

  // Evento: Adicionar ao carrinho (curtir/salvar arte)
  static trackAddToCart(data: {
    postId: string;
    title: string;
    category: string;
    action: 'like' | 'save';
  }) {
    if (!this.isLoaded()) return;

    window.fbq('track', 'AddToCart', {
      content_type: 'product',
      content_ids: [data.postId],
      content_name: data.title,
      content_category: data.category,
      value: 1,
      currency: 'BRL'
    });

    console.log('📊 Facebook Pixel: AddToCart tracked', data);
  }

  // Evento: Iniciar checkout (clique em "Assine o Premium")
  static trackInitiateCheckout(planData: {
    planName: string;
    value: number;
    currency: string;
  }) {
    if (!this.isLoaded()) return;

    window.fbq('track', 'InitiateCheckout', {
      content_name: planData.planName,
      value: planData.value,
      currency: planData.currency,
      content_category: 'subscription'
    });

    console.log('📊 Facebook Pixel: InitiateCheckout tracked', planData);
  }

  // Evento: Compra completada (via webhook Hotmart)
  static trackPurchase(data: {
    transactionId: string;
    planName: string;
    value: number;
    currency: string;
    email: string;
    phone?: string;
  }) {
    if (!this.isLoaded()) return;

    window.fbq('track', 'Purchase', {
      content_name: data.planName,
      content_type: 'product',
      content_ids: [data.transactionId],
      value: data.value,
      currency: data.currency,
      user_data: {
        email: data.email,
        phone: data.phone
      }
    });

    console.log('📊 Facebook Pixel: Purchase tracked', data);
  }

  // Evento: Visualização de página personalizada
  static trackPageView(pageName: string, data?: PixelEventData) {
    // Inicializa o pixel se necessário
    this.init();
    
    if (!this.isLoaded()) {
      console.warn('Facebook Pixel não está carregado');
      return;
    }

    try {
      if (data) {
        window.fbq('track', 'PageView', data);
      } else {
        window.fbq('track', 'PageView');
      }
      console.log('📊 Facebook Pixel: PageView tracked', { pageName, data });
    } catch (error) {
      console.error('Erro ao rastrear PageView:', error);
    }
  }

  // Evento customizado para categoria
  static trackCategoryView(categoryName: string, postCount: number) {
    if (!this.isLoaded()) return;

    window.fbq('trackCustom', 'CategoryView', {
      content_category: categoryName,
      content_name: `Category: ${categoryName}`,
      value: postCount
    });

    console.log('📊 Facebook Pixel: CategoryView tracked', { categoryName, postCount });
  }

  // Evento customizado para download
  static trackDownload(data: {
    postId: string;
    title: string;
    format: string;
    category: string;
  }) {
    if (!this.isLoaded()) return;

    window.fbq('trackCustom', 'DesignDownload', {
      content_type: 'download',
      content_ids: [data.postId],
      content_name: data.title,
      content_category: `${data.category} - ${data.format}`
    });

    console.log('📊 Facebook Pixel: DesignDownload tracked', data);
  }
}

export default FacebookPixelService;