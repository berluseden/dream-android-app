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

export default function BrowsePrograms() {
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [previewProgram, setPreviewProgram] = useState<ProgramTemplate | null>(null);
  
  const { data: programs, isLoading } = usePrograms(filters);
  const cloneTemplate = useCloneTemplate();

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
    </AppLayout>
  );
}