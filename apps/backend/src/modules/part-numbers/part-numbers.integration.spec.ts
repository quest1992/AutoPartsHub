import { PartNumberType } from '@prisma/client';
import { PartNumbersController } from './part-numbers.controller';

describe('Part numbers API integration', () => {
  it('routes search filters to the service without restricting number type', async () => {
    const service = { search: jest.fn().mockResolvedValue({ data: [] }) };
    const controller = new PartNumbersController(service as never);
    const query = { search: '90915-yzze1', page: 1, limit: 50 };

    await controller.search(query);

    expect(service.search).toHaveBeenCalledWith(query);
    expect(query).not.toHaveProperty('type', PartNumberType.OEM);
  });
});
