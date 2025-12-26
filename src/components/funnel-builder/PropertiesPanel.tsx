import { useCallback, useState, useEffect, useRef } from 'react';
import { Node } from '@xyflow/react';
import { Trash2, Plus, GripVertical, Upload, X, Image, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BlockType, BLOCK_INFO, BlockData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: Partial<BlockData>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const PropertiesPanel = ({ 
  selectedNode, 
  onUpdateNode, 
  onDeleteNode 
}: PropertiesPanelProps) => {
  const [localData, setLocalData] = useState<BlockData>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const nodeIdRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get current user id
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Sync local state with selected node
  useEffect(() => {
    if (selectedNode && selectedNode.id !== nodeIdRef.current) {
      nodeIdRef.current = selectedNode.id;
      setLocalData(selectedNode.data as BlockData);
    }
  }, [selectedNode?.id]);

  // Update local data when node data changes externally
  useEffect(() => {
    if (selectedNode && selectedNode.id === nodeIdRef.current) {
      setLocalData(selectedNode.data as BlockData);
    }
  }, [selectedNode?.data]);

  const handleChange = useCallback((field: keyof BlockData, value: any) => {
    if (!selectedNode) return;
    
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    
    // Debounce the update to prevent text loss
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onUpdateNode(selectedNode.id, { [field]: value });
    }, 300);
  }, [selectedNode, localData, onUpdateNode]);

  const handleChoiceChange = useCallback((index: number, field: 'label' | 'value', value: string) => {
    if (!selectedNode) return;
    
    const choices = [...(localData.choices || [])];
    choices[index] = { ...choices[index], [field]: value };
    
    const newData = { ...localData, choices };
    setLocalData(newData);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onUpdateNode(selectedNode.id, { choices });
    }, 300);
  }, [selectedNode, localData, onUpdateNode]);

  const addChoice = useCallback(() => {
    if (!selectedNode) return;
    
    const choices = [...(localData.choices || [])];
    const newChoice = {
      id: `choice_${Date.now()}`,
      label: `Opção ${choices.length + 1}`,
      value: String(choices.length + 1),
    };
    choices.push(newChoice);
    
    setLocalData({ ...localData, choices });
    onUpdateNode(selectedNode.id, { choices });
  }, [selectedNode, localData, onUpdateNode]);

  const removeChoice = useCallback((index: number) => {
    if (!selectedNode) return;
    
    const choices = [...(localData.choices || [])];
    choices.splice(index, 1);
    
    setLocalData({ ...localData, choices });
    onUpdateNode(selectedNode.id, { choices });
  }, [selectedNode, localData, onUpdateNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-border bg-card/50 p-4 flex items-center justify-center">
        <p className="text-muted-foreground text-sm text-center">
          Selecione um bloco para editar suas propriedades
        </p>
      </div>
    );
  }

  const blockType = (localData as any).blockType as BlockType;
  const info = BLOCK_INFO[blockType];

  return (
    <div className="w-80 border-l border-border bg-card/50 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{info?.label || 'Bloco'}</h3>
          <p className="text-xs text-muted-foreground">{info?.description}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDeleteNode(selectedNode.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Label field for all blocks */}
        <div className="space-y-2">
          <Label>Rótulo (opcional)</Label>
          <Input
            value={localData.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Nome interno do bloco"
          />
        </div>

        {/* Message block */}
        {(blockType === 'message' || blockType === 'action_message') && (
          <>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={localData.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Digite a mensagem..."
                className="min-h-[100px]"
              />
            </div>

            {/* Image Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Imagem (opcional)
              </Label>
              {localData.imageUrl ? (
                <div className="relative">
                  <img 
                    src={localData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => {
                      handleChange('imageUrl', undefined);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !userId) {
                        if (!userId) toast({ title: 'Usuário não autenticado', variant: 'destructive' });
                        return;
                      }
                      
                      setUploadingImage(true);
                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `${userId}/${fileName}`;
                        
                        const { error: uploadError } = await supabase.storage
                          .from('user-media')
                          .upload(filePath, file);
                        
                        if (uploadError) throw uploadError;
                        
                        const { data: { publicUrl } } = supabase.storage
                          .from('user-media')
                          .getPublicUrl(filePath);
                        
                        handleChange('imageUrl', publicUrl);
                        toast({ title: 'Imagem enviada com sucesso!' });
                      } catch (error: any) {
                        toast({ 
                          title: 'Erro ao enviar imagem', 
                          description: error.message,
                          variant: 'destructive' 
                        });
                      } finally {
                        setUploadingImage(false);
                        if (imageInputRef.current) imageInputRef.current.value = '';
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={uploadingImage}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? 'Enviando...' : 'Upload do PC'}
                    </Button>
                  </div>
                  <Input
                    value={localData.imageUrl || ''}
                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                    placeholder="Ou cole a URL da imagem..."
                  />
                </div>
              )}
            </div>

            {/* Video Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Vídeo (opcional)
              </Label>
              {localData.videoUrl ? (
                <div className="relative">
                  <video 
                    src={localData.videoUrl} 
                    className="w-full h-32 object-cover rounded-md border"
                    controls
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => {
                      handleChange('videoUrl', undefined);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !userId) {
                        if (!userId) toast({ title: 'Usuário não autenticado', variant: 'destructive' });
                        return;
                      }
                      
                      setUploadingVideo(true);
                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `${userId}/${fileName}`;
                        
                        const { error: uploadError } = await supabase.storage
                          .from('user-media')
                          .upload(filePath, file);
                        
                        if (uploadError) throw uploadError;
                        
                        const { data: { publicUrl } } = supabase.storage
                          .from('user-media')
                          .getPublicUrl(filePath);
                        
                        handleChange('videoUrl', publicUrl);
                        toast({ title: 'Vídeo enviado com sucesso!' });
                      } catch (error: any) {
                        toast({ 
                          title: 'Erro ao enviar vídeo', 
                          description: error.message,
                          variant: 'destructive' 
                        });
                      } finally {
                        setUploadingVideo(false);
                        if (videoInputRef.current) videoInputRef.current.value = '';
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={uploadingVideo}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingVideo ? 'Enviando...' : 'Upload do PC'}
                    </Button>
                  </div>
                  <Input
                    value={localData.videoUrl || ''}
                    onChange={(e) => handleChange('videoUrl', e.target.value)}
                    placeholder="Ou cole a URL do vídeo..."
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Question text block */}
        {blockType === 'question' && (
          <>
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Textarea
                value={localData.questionText || ''}
                onChange={(e) => handleChange('questionText', e.target.value)}
                placeholder="Qual é o seu nome?"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Salvar resposta em</Label>
              <Input
                value={localData.variableName || ''}
                onChange={(e) => handleChange('variableName', e.target.value)}
                placeholder="nome_usuario"
              />
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={localData.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                placeholder="Digite aqui..."
              />
            </div>
          </>
        )}

        {/* Question choice block */}
        {blockType === 'question_choice' && (
          <>
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Textarea
                value={localData.questionText || ''}
                onChange={(e) => handleChange('questionText', e.target.value)}
                placeholder="Escolha uma opção:"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Salvar resposta em</Label>
              <Input
                value={localData.variableName || ''}
                onChange={(e) => handleChange('variableName', e.target.value)}
                placeholder="escolha_usuario"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opções</Label>
                <Button size="sm" variant="outline" onClick={addChoice}>
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {(localData.choices || []).map((choice, index) => (
                  <div key={choice.id} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <Input
                      value={choice.label}
                      onChange={(e) => handleChoiceChange(index, 'label', e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeChoice(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Permitir múltipla escolha</Label>
              <Switch
                checked={localData.allowMultiple || false}
                onCheckedChange={(v) => handleChange('allowMultiple', v)}
              />
            </div>
          </>
        )}

        {/* Question number block */}
        {blockType === 'question_number' && (
          <>
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Textarea
                value={localData.questionText || ''}
                onChange={(e) => handleChange('questionText', e.target.value)}
                placeholder="Qual o valor?"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Salvar resposta em</Label>
              <Input
                value={localData.variableName || ''}
                onChange={(e) => handleChange('variableName', e.target.value)}
                placeholder="valor"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Mínimo</Label>
                <Input
                  type="number"
                  value={localData.min || ''}
                  onChange={(e) => handleChange('min', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo</Label>
                <Input
                  type="number"
                  value={localData.max || ''}
                  onChange={(e) => handleChange('max', Number(e.target.value))}
                />
              </div>
            </div>
          </>
        )}

        {/* Condition block */}
        {blockType === 'condition' && (
          <>
            <div className="space-y-2">
              <Label>Variável</Label>
              <Input
                value={localData.variable || ''}
                onChange={(e) => handleChange('variable', e.target.value)}
                placeholder="nome_variavel"
              />
            </div>
            <div className="space-y-2">
              <Label>Operador</Label>
              <Select
                value={localData.operator || 'equals'}
                onValueChange={(v) => handleChange('operator', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">É igual a</SelectItem>
                  <SelectItem value="not_equals">É diferente de</SelectItem>
                  <SelectItem value="contains">Contém</SelectItem>
                  <SelectItem value="greater">É maior que</SelectItem>
                  <SelectItem value="less">É menor que</SelectItem>
                  <SelectItem value="exists">Existe</SelectItem>
                  <SelectItem value="empty">Está vazio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {localData.operator !== 'exists' && localData.operator !== 'empty' && (
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  value={localData.value || ''}
                  onChange={(e) => handleChange('value', e.target.value)}
                  placeholder="Valor esperado"
                />
              </div>
            )}
          </>
        )}

        {/* Delay block */}
        {blockType === 'delay' && (
          <div className="space-y-2">
            <Label>Segundos de espera</Label>
            <Input
              type="number"
              min={1}
              max={300}
              value={localData.seconds || 5}
              onChange={(e) => handleChange('seconds', Number(e.target.value) || 5)}
            />
          </div>
        )}

        {/* Variable block */}
        {blockType === 'variable' && (
          <>
            <div className="space-y-2">
              <Label>Ação</Label>
              <Select
                value={localData.action || 'set'}
                onValueChange={(v) => handleChange('action', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Definir valor</SelectItem>
                  <SelectItem value="clear">Limpar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome da Variável</Label>
              <Input
                value={localData.variableName || ''}
                onChange={(e) => handleChange('variableName', e.target.value)}
                placeholder="minha_variavel"
              />
            </div>
            {localData.action === 'set' && (
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  value={localData.varValue || ''}
                  onChange={(e) => handleChange('varValue', e.target.value)}
                  placeholder="Valor a definir"
                />
              </div>
            )}
          </>
        )}

        {/* Notify block */}
        {blockType === 'action_notify' && (
          <>
            <div className="space-y-2">
              <Label>Mensagem de Notificação</Label>
              <Textarea
                value={localData.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Novo lead: {{nome}}"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input
                type="email"
                value={localData.notifyEmail || ''}
                onChange={(e) => handleChange('notifyEmail', e.target.value)}
                placeholder="admin@empresa.com"
              />
            </div>
          </>
        )}

        {/* Webhook block */}
        {blockType === 'action_webhook' && (
          <>
            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <Input
                value={localData.webhookUrl || ''}
                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                placeholder="https://api.exemplo.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select
                value={localData.webhookMethod || 'POST'}
                onValueChange={(v) => handleChange('webhookMethod', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {localData.webhookMethod === 'POST' && (
              <div className="space-y-2">
                <Label>Body (JSON)</Label>
                <Textarea
                  value={localData.webhookBody || ''}
                  onChange={(e) => handleChange('webhookBody', e.target.value)}
                  placeholder='{"nome": "{{nome}}"}'
                  className="min-h-[80px] font-mono text-xs"
                />
              </div>
            )}
          </>
        )}

        {/* Remarketing block */}
        {blockType === 'remarketing' && (
          <>
            <div className="space-y-2">
              <Label>Tipo de Remarketing</Label>
              <Select
                value={localData.remarketingType || 'inactivity'}
                onValueChange={(v) => handleChange('remarketingType', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactivity">Inatividade</SelectItem>
                  <SelectItem value="abandoned">Abandono de Funil</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {localData.remarketingType === 'inactivity' && 'Dispara quando o lead para de responder'}
                {localData.remarketingType === 'abandoned' && 'Dispara quando o lead abandona o funil'}
                {localData.remarketingType === 'followup' && 'Dispara após X horas do término'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Tempo de espera (horas)</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={localData.remarketingDelay || 24}
                onChange={(e) => handleChange('remarketingDelay', Number(e.target.value) || 24)}
              />
              <p className="text-xs text-muted-foreground">
                Tempo antes de disparar o remarketing
              </p>
            </div>
            <div className="space-y-2">
              <Label>Mensagem de Remarketing</Label>
              <Textarea
                value={localData.remarketingMessage || ''}
                onChange={(e) => handleChange('remarketingMessage', e.target.value)}
                placeholder="Oi {{nome}}! Notei que você não finalizou. Posso ajudar?"
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{variavel}}"} para dados do lead
              </p>
            </div>
            <div className="space-y-2">
              <Label>Máximo de tentativas</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={localData.remarketingMaxAttempts || 3}
                onChange={(e) => handleChange('remarketingMaxAttempts', Number(e.target.value) || 3)}
              />
              <p className="text-xs text-muted-foreground">
                Quantas vezes tentar reengajar
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
