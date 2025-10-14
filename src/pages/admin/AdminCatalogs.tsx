import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExercises } from '@/hooks/useExercises';
import { useTemplates } from '@/hooks/useTemplates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminCatalogs() {
  const { data: exercises, isLoading: exercisesLoading } = useExercises();
  const { data: templates, isLoading: templatesLoading } = useTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Catálogos</h2>
        <p className="text-muted-foreground">
          Administra los catálogos globales del sistema
        </p>
      </div>

      <Tabs defaultValue="exercises" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ejercicios</CardTitle>
              <CardDescription>
                Catálogo completo de ejercicios disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Músculo Principal</TableHead>
                    <TableHead>Equipamiento</TableHead>
                    <TableHead>Dificultad</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercisesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : exercises && exercises.length > 0 ? (
                    exercises.map((exercise) => (
                      <TableRow key={exercise.id}>
                        <TableCell className="font-medium">{exercise.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{exercise.prime_muscle}</Badge>
                        </TableCell>
                        <TableCell>
                          {exercise.equipment.map((eq, i) => (
                            <Badge key={i} variant="secondary" className="mr-1">
                              {eq}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              exercise.difficulty === 'advanced'
                                ? 'destructive'
                                : exercise.difficulty === 'intermediate'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {exercise.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {exercise.is_compound ? (
                            <Badge>Compuesto</Badge>
                          ) : (
                            <Badge variant="outline">Aislamiento</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay ejercicios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Entrenamiento</CardTitle>
              <CardDescription>
                Plantillas predefinidas de splits y rutinas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Split</TableHead>
                    <TableHead>Semanas</TableHead>
                    <TableHead>Días/Semana</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templatesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : templates && templates.length > 0 ? (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge>{template.split}</Badge>
                        </TableCell>
                        <TableCell>{template.weeks} semanas</TableCell>
                        <TableCell>{template.days_per_week} días</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {template.description}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay plantillas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
