import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { APP_ROUTES } from '@/core/constants'
import { LoginPage } from '@/features/auth'
import { CleaningSchedulePage } from '@/features/cleaning-schedule'
import { DashboardPage } from '@/features/dashboard'
import { EmployeesPage } from '@/features/employees'
import { IngredientsPage } from '@/features/ingredients'
import { NotFoundPage } from '@/features/errors'
import { PopPage } from '@/features/pop'
import { CommentsPage } from '@/features/comments'
import { ProductionPage } from '@/features/production'
import { RecipesPage } from '@/features/recipes'
import { SchedulePage } from '@/features/schedule'
import { PermissionRoute } from '@/app/router/PermissionRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { PublicOnlyRoute } from '@/app/router/PublicOnlyRoute'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path={APP_ROUTES.login} element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={APP_ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={APP_ROUTES.production} element={<ProductionPage />} />
            <Route path={APP_ROUTES.comments} element={<CommentsPage />} />
            <Route path={APP_ROUTES.schedule} element={<SchedulePage />} />
            <Route path={APP_ROUTES.cleaningSchedule} element={<CleaningSchedulePage />} />
            <Route path={APP_ROUTES.recipes} element={<RecipesPage />} />
            <Route path={APP_ROUTES.pop} element={<PopPage />} />
            <Route element={<PermissionRoute permission="employees:view" />}>
              <Route path={APP_ROUTES.employees} element={<EmployeesPage />} />
            </Route>
            <Route element={<PermissionRoute permission="ingredients:view" />}>
              <Route path={APP_ROUTES.ingredients} element={<IngredientsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path={APP_ROUTES.notFound} element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
