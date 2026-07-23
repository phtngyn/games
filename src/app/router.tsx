import { createBrowserRouter } from 'react-router-dom'

import { HomeScreen } from '@/app/screens/home-screen'
import { NotFoundScreen } from '@/app/screens/not-found-screen'
import { AppShell } from '@/app/shell/app-shell'
import { games } from '@/games/registry'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomeScreen /> },
      ...games.map((game) => ({
        path: game.path,
        element: <game.Screen />,
      })),
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
])
