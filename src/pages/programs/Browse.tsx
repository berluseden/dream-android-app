import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProgramFilters } from '@/components/programs/ProgramFilters';
import { ProgramCard } from '@/components/programs/ProgramCard';
import { ProgramPreviewModal } from '@/components/programs/ProgramPreviewModal';
import { usePrograms, ProgramTemplate, ProgramFilters as Filters } from '@/hooks/usePrograms';
import { useCloneTemplate } from '@/hooks/usePrograms';
import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useAIGenerateProgram } from '@/hooks/useAI';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function BrowsePrograms() {
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [previewProgram, setPreviewProgram] = useState<ProgramTemplate | null>(null);
  
  const { data: programs, isLoading } = usePrograms(filters);
  const cloneTemplate = useCloneTemplate();
  const aiGenerate = useAIGenerateProgram();
  const [showAIGen, setShowAIGen] = useState(false);
  const [aiGoal, setAiGoal] = useState('hypertrophy');
  const [aiDays, setAiDays] = useState(5);
  const [aiLevel, setAiLevel] = useState('intermediate');
  const [aiPreview, setAiPreview] = useState<any | null>(null);

  const filteredPrograms = programs?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUseProgram = async (program: ProgramTemplate) => {
    await cloneTemplate.mutateAsync(program.id);
    setPreviewProgram(null);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Catálogo de Programas</h1>
            <p className="text-muted-foreground">
              Explora programas comprobados para alcanzar tus objetivos
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar programas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowAIGen(true)}>
              Generar con AI
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className="lg:col-span-1">
            <ProgramFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Programs grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredPrograms || filteredPrograms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No se encontraron programas con estos filtros
                </p>
                <Button variant="outline" onClick={() => setFilters({})}>
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPrograms.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    onPreview={setPreviewProgram}
                    onUse={() => handleUseProgram(program)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <ProgramPreviewModal
          open={!!previewProgram}
          onOpenChange={(open) => !open && setPreviewProgram(null)}
          program={previewProgram}
          onUse={() => previewProgram && handleUseProgram(previewProgram)}
        />
      </div>

      {/* Modal: Generar Programa con AI */}
      <Dialog open={showAIGen} onOpenChange={setShowAIGen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar programa con AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Objetivo</Label>
                <select className="input" value={aiGoal} onChange={(e) => setAiGoal(e.target.value)}>
                  <option value="hypertrophy">Hipertrofia</option>
                  <option value="strength">Fuerza</option>
                  <option value="fatloss">Definición</option>
                </select>
              </div>
              <div>
                <Label>Días por semana</Label>
                <Input type="number" min={2} max={7} value={aiDays} onChange={(e) => setAiDays(parseInt(e.target.value || '5'))} />
              </div>
              <div className="col-span-2">
                <Label>Nivel</Label>
                <select className="input" value={aiLevel} onChange={(e) => setAiLevel(e.target.value)}>
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-md text-sm">
              {aiPreview ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(aiPreview, null, 2)}</pre>
              ) : (
                <p className="text-muted-foreground">Completa los campos y presiona Generar</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIGen(false)}>Cerrar</Button>
            <Button
              onClick={async () => {
                try {
                  const res = await aiGenerate.mutateAsync({ goal: aiGoal, daysPerWeek: aiDays, experience: aiLevel });
                  setAiPreview(res.program);
                } catch (e) {
                  setAiPreview({ error: 'No se pudo generar el programa ahora.' });
                }
              }}
              disabled={aiGenerate.isPending}
            >
              {aiGenerate.isPending ? 'Generando…' : 'Generar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}