import React from 'react'
import { Card } from '../ui/card'
import { CloudIcon } from 'lucide-react'
import { Separator } from '../ui/separator'
import { IntegrationModalBody } from './integration-modal-body'
import Modal from '../modal'

type Props = {
  name: 'stripe'
  logo: string
  title: string
  descrioption: string
  connections: {
    [key in 'stripe']: boolean
  }
}
//it is a button comp so when we click on it it triggeres the openning of a modal
const IntegrationTrigger = ({
  name,
  logo,
  title,
  descrioption,
  connections,
}: Props) => {
  return (
    <Modal
      title={title}
      type="Integration"
      logo={logo}
      description={descrioption}
      trigger={
        <Card className="px-3 py-2 cursor-pointer flex gap-2">
          <CloudIcon />
          {connections[name] ? 'connected' : 'connect'}
        </Card>
      }
    >
      <Separator orientation="horizontal" />
      <IntegrationModalBody
        connections={connections}
        type={name}
      />
    </Modal>
  )
}

export default IntegrationTrigger