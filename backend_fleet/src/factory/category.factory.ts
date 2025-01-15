import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from 'classes/entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryFactoryService {
  constructor(
    @InjectRepository(CategoryEntity, 'readOnlyConnection')
    private categoryRepository: Repository<CategoryEntity>,
  ) {}

  async createDefaultCategory(): Promise<CategoryEntity[]> {
    const categories = [
      {
        name: 'Spazzamento',
        description: 'Mezzo addetto a ....',
      },
      {
        name: 'Raccolta',
        description: 'Mezzo addetto a ....',
      },
      {
        name: 'Trasferenza',
        description: 'Mezzo addetto a ....',
      },
      {
        name: 'Servizi vari',
        description: 'Mezzo addetto a ....',
      },
    ];
    const categoryEntities = categories.map((categoryData) => {
      const category = new CategoryEntity();
      category.name = categoryData.name;
      category.description = categoryData.description;
      return category;
    });
    return this.categoryRepository.save(categoryEntities);
  }
}
