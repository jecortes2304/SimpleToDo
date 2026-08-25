package mapper

type Mapper[Entity any, Dto any] interface {
	ToDto(entity Entity) Dto
	ToEntity(dto Dto) Entity
}
