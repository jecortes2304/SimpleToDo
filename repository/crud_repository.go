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
	db.Model(model).Count(&totalRows)

	calculatePagination(totalRows, pagination)

	return func(db *gorm.DB) *gorm.DB {
		return db.Offset(pagination.GetOffset()).Limit(pagination.GetLimit()).Order(pagination.GetSort())
	}
}

func PaginateWithConditions(model interface{}, conditions []response.Condition, pagination *response.Pagination, db *gorm.DB) func(db *gorm.DB) *gorm.DB {
	var totalRows int64

	if len(conditions) > 0 {
		queryStr, args := response.ToQueryStringMany(conditions)
		db.Model(model).Where(queryStr, args...).Count(&totalRows)
	} else {
		db.Model(model).Count(&totalRows)
	}

	calculatePagination(totalRows, pagination)

	return func(db *gorm.DB) *gorm.DB {
		return db.Offset(pagination.GetOffset()).Limit(pagination.GetLimit()).Order(pagination.GetSort())
	}
}

func calculatePagination(totalRows int64, pagination *response.Pagination) {
	// Assign the total rows to the pagination and calculate the total pages
	pagination.TotalItems = totalRows
	if pagination.Limit > 0 {
		pagination.TotalPages = int(math.Ceil(float64(totalRows) / float64(pagination.Limit)))
	} else {
		pagination.TotalPages = 1
	}
}
