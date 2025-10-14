import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCog } from 'lucide-react';

interface CoachData {
  id: string;
  name: string;
  email: string;
  max_clients: number;
  current_clients: number;
  specializations: string[];
  certifications: string[];
}

export default function AdminCoaches() {
  const { data: coaches, isLoading } = useQuery({
    queryKey: ['admin', 'coaches'],
    queryFn: async () => {
      // Get all coach roles
      const rolesQuery = query(
        collection(db, 'user_roles'),
        where('role', '==', 'coach')
      );
      const rolesSnapshot = await getDocs(rolesQuery);
      
      const coachesData: CoachData[] = [];
      
      for (const roleDoc of rolesSnapshot.docs) {
        const coachId = roleDoc.id;
        
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', coachId));
        const userData = userDoc.data();
        
        if (!userData) continue;
        
        // Get coach profile
        const coachProfileDoc = await getDoc(doc(db, 'coach_profiles', coachId));
        const coachProfile = coachProfileDoc.data();
        
        // Count clients
        const clientsQuery = query(
          collection(db, 'users'),
          where('coach_id', '==', coachId)
        );
        const clientsSnapshot = await getDocs(clientsQuery);
        
        coachesData.push({
          id: coachId,
          name: userData.name,
          email: userData.email,
          max_clients: coachProfile?.max_clients || 20,
          current_clients: clientsSnapshot.size,
          specializations: coachProfile?.specializations || [],
          certifications: coachProfile?.certifications || [],
        });
      }
      
      return coachesData;
    },
  });

  const getCapacityBadge = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return <Badge variant="destructive">{current}/{max}</Badge>;
    if (percentage >= 70) return <Badge variant="default">{current}/{max}</Badge>;
    return <Badge variant="secondary">{current}/{max}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Coaches</h2>
          <p className="text-muted-foreground">
            Administra la capacidad y asignaciones de coaches
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coaches Activos</CardTitle>
          <CardDescription>
            Vista general de todos los coaches y su capacidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Especializaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : coaches && coaches.length > 0 ? (
                coaches.map((coach) => (
                  <TableRow key={coach.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                        {coach.name}
                      </div>
                    </TableCell>
                    <TableCell>{coach.email}</TableCell>
                    <TableCell>{coach.current_clients}</TableCell>
                    <TableCell>
                      {getCapacityBadge(coach.current_clients, coach.max_clients)}
                    </TableCell>
                    <TableCell>
                      {coach.specializations.length > 0 ? (
                        <div className="flex gap-1">
                          {coach.specializations.map((spec, i) => (
                            <Badge key={i} variant="outline">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No se encontraron coaches
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
