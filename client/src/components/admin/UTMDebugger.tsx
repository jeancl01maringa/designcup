/**
 * Componente para debugar e visualizar UTMs capturados pelo UTMify
 * Mostra em tempo real os UTMs detectados nas campanhas
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUTMTracking } from "@/hooks/use-utm-tracking";
import { Eye, Link, Target } from "lucide-react";

export function UTMDebugger() {
  const { utmData, isReady, campaignString, fullUTMString, hasUTMs } = useUTMTracking();

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <CardTitle className="text-sm">UTM Debugger</CardTitle>
          <Badge variant={isReady ? "default" : "secondary"} className="text-xs">
            {isReady ? "Ativo" : "Carregando"}
          </Badge>
        </div>
        <CardDescription>
          Monitor de UTMs em tempo real via UTMify (Hotmart)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasUTMs ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {utmData.utm_source && (
                <div>
                  <span className="text-muted-foreground">Source:</span>
                  <div className="font-mono text-blue-600">{utmData.utm_source}</div>
                </div>
              )}
              {utmData.utm_medium && (
                <div>
                  <span className="text-muted-foreground">Medium:</span>
                  <div className="font-mono text-green-600">{utmData.utm_medium}</div>
                </div>
              )}
              {utmData.utm_campaign && (
                <div>
                  <span className="text-muted-foreground">Campaign:</span>
                  <div className="font-mono text-purple-600">{utmData.utm_campaign}</div>
                </div>
              )}
              {utmData.utm_content && (
                <div>
                  <span className="text-muted-foreground">Content:</span>
                  <div className="font-mono text-orange-600">{utmData.utm_content}</div>
                </div>
              )}
              {utmData.utm_term && (
                <div>
                  <span className="text-muted-foreground">Term:</span>
                  <div className="font-mono text-pink-600">{utmData.utm_term}</div>
                </div>
              )}
            </div>
            
            {campaignString && (
              <div className="border-t pt-3">
                <div className="text-sm text-muted-foreground mb-1">String para Banco:</div>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {campaignString}
                </code>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {isReady ? (
              <>
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum UTM detectado na URL atual</p>
                <p className="text-xs mt-1">
                  Teste com: ?utm_source=facebook&utm_medium=cpc&utm_campaign=botox_janeiro
                </p>
              </>
            ) : (
              <>
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/3 mx-auto"></div>
                </div>
                <p className="mt-2">Aguardando UTMify...</p>
              </>
            )}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground border-t pt-2">
          UTMify Status: {isReady ? "✓ Carregado" : "⏳ Aguardando"}
        </div>
      </CardContent>
    </Card>
  );
}