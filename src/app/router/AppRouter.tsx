import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { APP_ROUTES } from '@/core/constants'
import { PermissionRoute } from '@/app/router/PermissionRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { PublicOnlyRoute } from '@/app/router/PublicOnlyRoute'

function lazyPage(
  factory: () => Promise<{ default: ComponentType }>,
): LazyExoticComponent<ComponentType> {
  return lazy(factory)
}

const LoginPage = lazyPage(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const ChangePasswordPage = lazyPage(() =>
  import('@/features/auth/pages/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })),
)
const DashboardPage = lazyPage(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ProductionPage = lazyPage(() =>
  import('@/features/production/pages/ProductionPage').then((m) => ({ default: m.ProductionPage })),
)
const BreadControlPage = lazyPage(() =>
  import('@/features/bread-control/pages/BreadControlPage').then((m) => ({ default: m.BreadControlPage })),
)
const WasteControlPage = lazyPage(() =>
  import('@/features/waste-control/pages/WasteControlPage').then((m) => ({ default: m.WasteControlPage })),
)
const IntelligencePage = lazyPage(() =>
  import('@/features/intelligence/pages/IntelligencePage').then((m) => ({ default: m.IntelligencePage })),
)
const AuditPage = lazyPage(() =>
  import('@/features/audit/pages/AuditPage').then((m) => ({ default: m.AuditPage })),
)
const CommentsPage = lazyPage(() =>
  import('@/features/comments/pages/CommentsPage').then((m) => ({ default: m.CommentsPage })),
)
const SchedulePage = lazyPage(() =>
  import('@/features/schedule/pages/SchedulePage').then((m) => ({ default: m.SchedulePage })),
)
const CleaningSchedulePage = lazyPage(() =>
  import('@/features/cleaning-schedule/pages/CleaningSchedulePage').then((m) => ({
    default: m.CleaningSchedulePage,
  })),
)
const RecipesPage = lazyPage(() =>
  import('@/features/recipes/pages/RecipesPage').then((m) => ({ default: m.RecipesPage })),
)
const RecipeDetailPage = lazyPage(() =>
  import('@/features/recipes/pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage })),
)
const PopPage = lazyPage(() =>
  import('@/features/pop/pages/PopPage').then((m) => ({ default: m.PopPage })),
)
const EmployeesPage = lazyPage(() =>
  import('@/features/employees/pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })),
)
const IngredientsPage = lazyPage(() =>
  import('@/features/ingredients/pages/IngredientsPage').then((m) => ({ default: m.IngredientsPage })),
)
const LabelsPage = lazyPage(() =>
  import('@/features/labels/pages/LabelsPage').then((m) => ({ default: m.LabelsPage })),
)
const NiimbotConnectionPage = lazyPage(() =>
  import('@/features/niimbot/pages/NiimbotConnectionPage').then((m) => ({
    default: m.NiimbotConnectionPage,
  })),
)
const NotFoundPage = lazyPage(() =>
  import('@/features/errors/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

function LegacyRecipeRedirect() {
  const { recipeId } = useParams()
  return <Navigate to={recipeId ? `${APP_ROUTES.recipes}/${recipeId}` : APP_ROUTES.recipes} replace />
}

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
            <Route element={<PermissionRoute permission="labels:view" />}>
              <Route path={APP_ROUTES.labels} element={<LabelsPage />} />
            </Route>
            <Route path={APP_ROUTES.niimbot} element={<NiimbotConnectionPage />} />
            <Route element={<PermissionRoute permission="bread-control:view" />}>
              <Route path={APP_ROUTES.breadControl} element={<BreadControlPage />} />
            </Route>
            <Route element={<PermissionRoute permission="waste-control:view" />}>
              <Route path={APP_ROUTES.wasteControl} element={<WasteControlPage />} />
            </Route>
            <Route element={<PermissionRoute permission="intelligence:view" />}>
              <Route path={APP_ROUTES.intelligence} element={<IntelligencePage />} />
            </Route>
            <Route element={<PermissionRoute permission="audit:view" />}>
              <Route path={APP_ROUTES.audit} element={<AuditPage />} />
            </Route>
            <Route path={APP_ROUTES.comments} element={<CommentsPage />} />
            <Route path={APP_ROUTES.schedule} element={<SchedulePage />} />
            <Route path={APP_ROUTES.cleaningSchedule} element={<CleaningSchedulePage />} />
            <Route path={APP_ROUTES.recipes} element={<RecipesPage />} />
            <Route path={`${APP_ROUTES.recipes}/:recipeId`} element={<RecipeDetailPage />} />
            <Route path="/recipes" element={<Navigate to={APP_ROUTES.recipes} replace />} />
            <Route path="/recipes/:recipeId" element={<LegacyRecipeRedirect />} />
            <Route path={APP_ROUTES.pop} element={<PopPage />} />
            <Route element={<PermissionRoute permission="employees:view" />}>
              <Route path={APP_ROUTES.employees} element={<EmployeesPage />} />
            </Route>
            <Route element={<PermissionRoute permission="ingredients:view" />}>
              <Route path={APP_ROUTES.ingredients} element={<IngredientsPage />} />
            </Route>
            <Route path={APP_ROUTES.changePassword} element={<ChangePasswordPage />} />
            <Route path="*" element={<Navigate to={APP_ROUTES.dashboard} replace />} />
          </Route>
        </Route>

        <Route path={APP_ROUTES.notFound} element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
