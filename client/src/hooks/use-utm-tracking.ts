/**
 * Hook personalizado para integração com UTMify (Hotmart)
 * Captura automaticamente UTMs da URL e dados do UTMify
 */

import { useState, useEffect } from 'react';

interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

interface UTMifyData {
  getUtms: () => UTMData;
  isReady: boolean;
}

declare global {
  interface Window {
    UTMify?: UTMifyData;
  }
}

export function useUTMTracking() {
  const [utmData, setUtmData] = useState<UTMData>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkUTMify = () => {
      if (window.UTMify && window.UTMify.isReady) {
        const utms = window.UTMify.getUtms();
        setUtmData(utms);
        setIsReady(true);
        return true;
      }
      return false;
    };

    // Verificar se UTMify já está carregado
    if (checkUTMify()) {
      return;
    }

    // Aguardar carregamento do UTMify
    const interval = setInterval(() => {
      if (checkUTMify()) {
        clearInterval(interval);
      }
    }, 100);

    // Cleanup após 10 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      // Fallback: capturar UTMs da URL manualmente
      const urlParams = new URLSearchParams(window.location.search);
      const fallbackUtms: UTMData = {
        utm_source: urlParams.get('utm_source') || undefined,
        utm_medium: urlParams.get('utm_medium') || undefined,
        utm_campaign: urlParams.get('utm_campaign') || undefined,
        utm_content: urlParams.get('utm_content') || undefined,
        utm_term: urlParams.get('utm_term') || undefined,
      };
      
      // Só atualizar se encontrou UTMs
      if (Object.values(fallbackUtms).some(value => value)) {
        setUtmData(fallbackUtms);
        setIsReady(true);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Função para obter string de campanha formatada
  const getCampaignString = () => {
    if (!utmData.utm_campaign) return '';
    
    const parts = [
      utmData.utm_source,
      utmData.utm_medium,
      utmData.utm_campaign
    ].filter(Boolean);
    
    return parts.join('_').toLowerCase();
  };

  // Função para obter dados completos do UTM
  const getFullUTMString = () => {
    const parts = [
      utmData.utm_source && `source:${utmData.utm_source}`,
      utmData.utm_medium && `medium:${utmData.utm_medium}`,
      utmData.utm_campaign && `campaign:${utmData.utm_campaign}`,
      utmData.utm_content && `content:${utmData.utm_content}`,
      utmData.utm_term && `term:${utmData.utm_term}`
    ].filter(Boolean);
    
    return parts.join('|');
  };

  return {
    utmData,
    isReady,
    campaignString: getCampaignString(),
    fullUTMString: getFullUTMString(),
    hasUTMs: Object.values(utmData).some(value => value)
  };
}