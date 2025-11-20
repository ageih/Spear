import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

export function Binic() {
    return (
        <div style={{
            height: '18px',
            width: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

        }}>
            <FontAwesomeIcon icon={faTrash} />
        </div>
    )
}

export function Editic() {
    return (
        <div style={{
            height: '18px',
            width: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'blue',
        }}>
            <FontAwesomeIcon icon={faEdit} />
        </div>
    )
}
export function Deleteic() {
    return (
        <div style={{
            height: '18px',
            width: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'red'

        }}>
            <FontAwesomeIcon icon={faTrash} />
        </div>
    )
}



