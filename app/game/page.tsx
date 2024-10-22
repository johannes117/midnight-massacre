import { Suspense } from 'react'
import { GameComponent } from '@/components/game-component'
import SpookyLoader from '@/components/spooky-loader'

export default function Game() {
  return (
    <main>
      <Suspense fallback={<SpookyLoader />}>
        <GameComponent />
      </Suspense>
    </main>
  )
}
