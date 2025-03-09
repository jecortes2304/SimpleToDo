package repository

import (
	"SimpleToDo/dto/response"
	"gorm.io/gorm"
	"math"
)

type CrudRepository[Entity any] interface {
	Save(Entity)
	Update(entity Entity)
	Delete(id int)
	FindById(id int) (entity Entity, err error)
	FindAll() []Entity
}

func Paginate(model interface{}, pagination *response.Pagination, db *gorm.DB) func(db *gorm.DB) *gorm.DB {
	var totalRows int64
	// Ensure that count is in the right model
	db.Model(model).Count(&totalRows)

	// Assign the total rows to the pagination and calculate the total pages
	pagination.TotalItems = totalRows
	if pagination.Limit > 0 {
		pagination.TotalPages = int(math.Ceil(float64(totalRows) / float64(pagination.Limit)))
	} else {
		pagination.TotalPages = 1
	}

	return func(db *gorm.DB) *gorm.DB {
		return db.Offset(pagination.GetOffset()).Limit(pagination.GetLimit()).Order(pagination.GetSort())
	}
}
