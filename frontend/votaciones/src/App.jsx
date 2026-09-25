import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { RutaAdministrador } from './components/common/RutasProtegidas';
import { AuthProvider } from './context/AuthContext';
import { CabinaVotacionPage } from './pages/CabinaVotacionPage';
import { CandidatoDetallePage } from './pages/CandidatoDetallePage';
import { InicioPage } from './pages/InicioPage';
import { LoginAdminPage } from './pages/LoginAdminPage';
import { MonitorRealTimePage } from './pages/MonitorRealTimePage';
import { PlanTrabajoCandidatoPage } from './pages/PlanTrabajoCandidatoPage';
import { PropuestasPage } from './pages/PropuestasPage';
import { RegistroIngresoPage } from './pages/RegistroIngresoPage';
import { ResultadosElectoralesPage } from './pages/ResultadosElectoralesPage';

/**
 * Componentes separados por perfil:
 *
 * * **Público**: inicio, propuestas y micrositios de los candidatos.
 * * **Votante**: cabina de votación, habilitada tras validar la cédula.
 * * **Administrador**: login, validación de ingreso, monitor en vivo y cierre.
 *   Los resultados quedan disponibles para ambos perfiles cuando el
 *   administrador los publica al cerrar la jornada.
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-sena-bg">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Público */}
              <Route path="/" element={<InicioPage />} />
              <Route path="/propuestas" element={<PropuestasPage />} />
              <Route path="/propuestas/:id" element={<CandidatoDetallePage />} />
              <Route path="/propuestas/:id/plan" element={<PlanTrabajoCandidatoPage />} />

              {/* Votante: la propia cabina valida la cédula */}
              <Route path="/cabina" element={<CabinaVotacionPage />} />

              {/* Resultados: el backend decide si el perfil puede verlos */}
              <Route path="/resultados" element={<ResultadosElectoralesPage />} />

              {/* Administrador */}
              <Route path="/admin/login" element={<LoginAdminPage />} />
              <Route element={<RutaAdministrador />}>
                <Route path="/admin/ingreso" element={<RegistroIngresoPage />} />
                <Route path="/monitor" element={<MonitorRealTimePage />} />
              </Route>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
