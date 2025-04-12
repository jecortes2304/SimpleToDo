package response

type Pagination struct {
	Limit      int         `json:"limit,omitempty;query:limit"`
	Page       int         `json:"page,omitempty;query:page"`
	Sort       string      `json:"sort,omitempty;query:sort"`
	TotalItems int64       `json:"totalItems"`
	TotalPages int         `json:"totalPages"`
	Items      interface{} `json:"items"`
}

func (p *Pagination) GetOffset() int {
	return (p.GetPage() - 1) * p.GetLimit()
}

func (p *Pagination) GetLimit() int {
	if p.Limit == 0 {
		p.Limit = 10
	}
	return p.Limit
}

func (p *Pagination) GetPage() int {
	if p.Page == 0 {
		p.Page = 1
	}
	return p.Page
}

func (p *Pagination) GetSort() string {
	if p.Sort == "" {
		p.Sort = "Id desc"
	}
	return p.Sort
}

type Operator string

const (
	Equal              Operator = "="
	NotEqual           Operator = "!="
	GreaterThan        Operator = ">"
	GreaterThanOrEqual Operator = ">="
	LessThan           Operator = "<"
	LessThanOrEqual    Operator = "<="
	Like               Operator = "LIKE"
	In                 Operator = "IN"
	NotIn              Operator = "NOT IN"
	Between            Operator = "BETWEEN"
	NotBetween         Operator = "NOT BETWEEN"
	Exists             Operator = "EXISTS"
	NotExists          Operator = "NOT EXISTS"
)

type Modifier string

const (
	Asc    Modifier = "ASC"
	Desc   Modifier = "DESC"
	Limit  Modifier = "LIMIT"
	Offset Modifier = "OFFSET"
	Count  Modifier = "COUNT"
	Avg    Modifier = "AVG"
	Sum    Modifier = "SUM"
	Max    Modifier = "MAX"
	Min    Modifier = "MIN"
	And    Modifier = "AND"
	Or     Modifier = "OR"
	Not    Modifier = "NOT"
	Empty  Modifier = ""
)

type ConditionActions interface {
	ToQueryStringWithValue() (string, any)
	GetQueryString() string
	ToQueryStringMany(conditions []Condition) (string, []any)
}

type Condition struct {
	Column   string   `json:"column"`
	Operator Operator `json:"operator"`
	Modifier Modifier `json:"modifier"`
	Value    any      `json:"value"`
}

func NewCondition(column string, operator Operator, value any, modifier Modifier) *Condition {
	return &Condition{
		Column:   column,
		Operator: operator,
		Modifier: modifier,
		Value:    value,
	}
}

func (c *Condition) GetQueryString() string {
	return c.Column + " " + string(c.Operator) + " ?"
}

func (c *Condition) ToQueryStringWithValue() (string, any) {
	return c.Column + " " + string(c.Operator) + " ?", c.Value
}

func ToQueryStringMany(conditions []Condition) (string, []any) {
	var queryParts []string
	var values []any

	for _, cond := range conditions {
		queryParts = append(queryParts, cond.GetQueryString())
		values = append(values, cond.Value)
	}

	query := ""
	for i := 0; i < len(queryParts); i++ {
		query += queryParts[i]
		if i != len(queryParts)-1 {
			query += " " + string(conditions[i].Modifier) + " "
		}
	}

	return query, values
}
