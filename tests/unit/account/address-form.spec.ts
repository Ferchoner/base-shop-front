import { describe, expect, it } from 'vitest';
import { addressProblemErrors } from '~/shared/address/address-form';
import { ApiProblem } from '~/shared/api/problem';

describe('libreta de direcciones (REQUIREMENTS §5.11)', () => {
  it('pone los errores de ubicación en su campo con mensaje propio', () => {
    const problem = new ApiProblem({
      type: 'validation-error',
      status: 400,
      title: '',
      errors: [
        { field: 'stateCode', code: 'isState', message: 'Texto de la API' },
        {
          field: 'municipalityCode',
          code: 'isActiveMunicipality',
          message: 'Texto de la API',
        },
        { field: 'phone', code: 'matches', message: 'Teléfono inválido' },
        { field: 'isDefault', code: 'isBoolean', message: 'Otro campo' },
      ],
    });
    expect(addressProblemErrors(problem, 'address')).toEqual({
      fieldErrors: [
        { name: 'address.stateCode', message: 'Elige un estado de la lista.' },
        {
          name: 'address.municipalityCode',
          message: 'Ese municipio ya no está en el catálogo. Elige otro.',
        },
        { name: 'address.phone', message: 'Teléfono inválido' },
      ],
      otherMessages: ['Otro campo'],
    });
  });
});
