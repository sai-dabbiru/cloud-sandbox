// app/labs/[labId]/page.tsx

import { notFound } from 'next/navigation'
import LabInterface from '../../../lab-interface'
import labConfig from '../../../labConfig.json'


type LabData = {
  label: string
  startUrl: string
  deleteUrl: string
  checkUrl: string
  duration: number
}

export default function LabPage({ params }: { params: { labId: string } }) {
  const labId = params.labId as keyof typeof labConfig.labs
  const lab: LabData | undefined = labConfig.labs[labId]
  
  if (!lab) return notFound()

  return (
    <main className="p-4">
      <LabInterface selectedLab={labId}  />
    </main>
  )
}
